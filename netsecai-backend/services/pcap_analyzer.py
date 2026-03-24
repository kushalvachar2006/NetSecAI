import logging
import time
from collections import defaultdict, Counter
from pathlib import Path

from models import (
    PCAPAnalyzeResponse, PacketSummary, AnomalyAlert, RiskLevel
)
from services.detection_engine import score_anomalies

logger = logging.getLogger("netsecai.pcap_analyzer")

# Thresholds for anomaly detection
SYN_FLOOD_THRESHOLD = 100       # SYN packets from single source
PORT_SCAN_THRESHOLD = 15        # distinct destination ports from one source
ICMP_FLOOD_THRESHOLD = 200      # ICMP packets from single source
LARGE_PAYLOAD_THRESHOLD = 9000  # bytes


def _parse_with_scapy(pcap_path: str) -> list[dict]:
    """Parse PCAP using Scapy and return normalised packet dicts."""
    try:
        from scapy.all import rdpcap, TCP, UDP, ICMP, IP, IPv6, DNS, Raw
    except ImportError as exc:
        raise RuntimeError("Scapy is not installed: pip install scapy") from exc

    packets_raw = rdpcap(pcap_path)
    results = []

    for idx, pkt in enumerate(packets_raw):
        record: dict = {
            "index": idx,
            "timestamp": float(pkt.time),
            "length": len(pkt),
            "src_ip": None,
            "dst_ip": None,
            "src_port": None,
            "dst_port": None,
            "protocol": "Unknown",
            "flags": None,
            "info": None,
        }

        if IP in pkt:
            record["src_ip"] = pkt[IP].src
            record["dst_ip"] = pkt[IP].dst
            record["protocol"] = "IP"
        elif IPv6 in pkt:
            record["src_ip"] = pkt[IPv6].src
            record["dst_ip"] = pkt[IPv6].dst
            record["protocol"] = "IPv6"

        if TCP in pkt:
            record["src_port"] = pkt[TCP].sport
            record["dst_port"] = pkt[TCP].dport
            record["protocol"] = "TCP"
            flags_val = pkt[TCP].flags
            record["flags"] = str(flags_val)
            record["info"] = f"TCP {pkt[TCP].sport} → {pkt[TCP].dport} [{flags_val}]"
        elif UDP in pkt:
            record["src_port"] = pkt[UDP].sport
            record["dst_port"] = pkt[UDP].dport
            record["protocol"] = "UDP"
            record["info"] = f"UDP {pkt[UDP].sport} → {pkt[UDP].dport}"

        if ICMP in pkt:
            record["protocol"] = "ICMP"
            record["info"] = f"ICMP type={pkt[ICMP].type} code={pkt[ICMP].code}"

        if DNS in pkt:
            record["protocol"] = "DNS"
            try:
                if pkt[DNS].qd:
                    record["info"] = f"DNS query: {pkt[DNS].qd.qname.decode()}"
            except Exception:
                pass

        results.append(record)

    return results


def _detect_anomalies(packets: list[dict]) -> list[AnomalyAlert]:
    anomalies: list[AnomalyAlert] = []

    # --- SYN flood detection ------------------------------------------------
    syn_counts: Counter = Counter()
    for pkt in packets:
        if pkt["protocol"] == "TCP" and pkt.get("flags") and "S" in str(pkt["flags"]) and "A" not in str(pkt["flags"]):
            if pkt["src_ip"]:
                syn_counts[pkt["src_ip"]] += 1

    for src_ip, count in syn_counts.items():
        if count >= SYN_FLOOD_THRESHOLD:
            anomalies.append(AnomalyAlert(
                type="syn_flood",
                description=f"Possible SYN flood from {src_ip} ({count} SYN packets)",
                severity=RiskLevel.CRITICAL if count >= 500 else RiskLevel.HIGH,
                source_ip=src_ip,
                details={"syn_count": count},
            ))

    # --- Port scan detection ------------------------------------------------
    src_dst_ports: dict[str, set[int]] = defaultdict(set)
    for pkt in packets:
        if pkt["src_ip"] and pkt["dst_port"] is not None:
            src_dst_ports[pkt["src_ip"]].add(pkt["dst_port"])

    for src_ip, ports in src_dst_ports.items():
        if len(ports) >= PORT_SCAN_THRESHOLD:
            anomalies.append(AnomalyAlert(
                type="port_scan",
                description=f"Possible port scan from {src_ip} ({len(ports)} distinct ports probed)",
                severity=RiskLevel.HIGH if len(ports) >= 50 else RiskLevel.MEDIUM,
                source_ip=src_ip,
                details={"ports_probed": len(ports), "sample_ports": sorted(ports)[:20]},
            ))

    # --- ICMP flood detection -----------------------------------------------
    icmp_counts: Counter = Counter()
    for pkt in packets:
        if pkt["protocol"] == "ICMP" and pkt["src_ip"]:
            icmp_counts[pkt["src_ip"]] += 1

    for src_ip, count in icmp_counts.items():
        if count >= ICMP_FLOOD_THRESHOLD:
            anomalies.append(AnomalyAlert(
                type="icmp_flood",
                description=f"ICMP flood detected from {src_ip} ({count} packets)",
                severity=RiskLevel.HIGH,
                source_ip=src_ip,
                details={"icmp_count": count},
            ))

    # --- Large payload detection --------------------------------------------
    large_payloads = [
        pkt for pkt in packets if pkt["length"] >= LARGE_PAYLOAD_THRESHOLD
    ]
    if large_payloads:
        anomalies.append(AnomalyAlert(
            type="large_payload",
            description=f"{len(large_payloads)} packets with unusually large payloads (≥{LARGE_PAYLOAD_THRESHOLD}B)",
            severity=RiskLevel.MEDIUM,
            source_ip=None,
            details={"count": len(large_payloads), "max_bytes": max(p["length"] for p in large_payloads)},
        ))

    # --- DNS amplification check -------------------------------------------
    dns_responses = [p for p in packets if p["protocol"] == "DNS" and p.get("src_port") == 53]
    if len(dns_responses) > 50:
        dst_counter: Counter = Counter(p["dst_ip"] for p in dns_responses if p["dst_ip"])
        victim, count = dst_counter.most_common(1)[0] if dst_counter else (None, 0)
        if count > 50:
            anomalies.append(AnomalyAlert(
                type="dns_amplification",
                description=f"Possible DNS amplification attack targeting {victim} ({count} responses)",
                severity=RiskLevel.HIGH,
                source_ip=victim,
                details={"response_count": count},
            ))

    return anomalies


async def analyze_pcap(pcap_path: str) -> PCAPAnalyzeResponse:
    logger.info("Analysing PCAP: %s", pcap_path)
    start = time.perf_counter()

    if not Path(pcap_path).exists():
        raise FileNotFoundError(f"PCAP file not found: {pcap_path}")

    raw_packets = _parse_with_scapy(pcap_path)
    logger.info("Parsed %d packets", len(raw_packets))

    # Duration
    if len(raw_packets) >= 2:
        duration = raw_packets[-1]["timestamp"] - raw_packets[0]["timestamp"]
    else:
        duration = 0.0

    # Protocol distribution
    protocol_counter: Counter = Counter(p["protocol"] for p in raw_packets)

    # Top talkers by packet count
    src_counter: Counter = Counter(p["src_ip"] for p in raw_packets if p["src_ip"])
    top_talkers = [
        {"ip": ip, "packets": cnt}
        for ip, cnt in src_counter.most_common(10)
    ]

    # Build PacketSummary list (capped at 500 for response size)
    packets = [
        PacketSummary(
            index=p["index"],
            timestamp=p["timestamp"],
            src_ip=p["src_ip"],
            dst_ip=p["dst_ip"],
            src_port=p["src_port"],
            dst_port=p["dst_port"],
            protocol=p["protocol"],
            length=p["length"],
            flags=p["flags"],
            info=p["info"],
        )
        for p in raw_packets[:500]
    ]

    anomalies = _detect_anomalies(raw_packets)
    risk_score = score_anomalies(anomalies)

    elapsed = time.perf_counter() - start
    logger.info(
        "PCAP analysis done in %.2fs: %d anomalies, risk=%d",
        elapsed, len(anomalies), risk_score,
    )

    return PCAPAnalyzeResponse(
        total_packets=len(raw_packets),
        duration_seconds=round(duration, 3),
        protocols=dict(protocol_counter),
        top_talkers=top_talkers,
        packets=packets,
        anomalies=anomalies,
        risk_score=risk_score,
    )
