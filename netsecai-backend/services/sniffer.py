import logging
import time
import threading
from collections import Counter, defaultdict

from config import settings
from models import LivePacket, AnomalyAlert, RiskLevel, SnifferStatus

logger = logging.getLogger("netsecai.sniffer")

SYN_FLOOD_THRESHOLD = 80
PORT_SCAN_THRESHOLD = 10


class SnifferService:
    def __init__(self) -> None:
        self._running = False
        self._thread: threading.Thread | None = None
        self._packets: list[LivePacket] = []
        self._alerts: list[AnomalyAlert] = []
        self._protocol_stats: Counter = Counter()
        self._lock = threading.Lock()
        self._start_time: float | None = None
        self._interface: str | None = None
        self._error: str | None = None

        # Anomaly tracking
        self._syn_counts: Counter = Counter()
        self._port_probe: dict[str, set] = defaultdict(set)

    # ── Public API ──────────────────────────────────────────────────────────

    def start(self, interface: str | None = None) -> SnifferStatus:
        if self._running:
            return self.status()

        self._packets.clear()
        self._alerts.clear()
        self._protocol_stats.clear()
        self._syn_counts.clear()
        self._port_probe.clear()
        self._error = None
        self._interface = interface or None
        self._start_time = time.time()
        self._running = True

        self._thread = threading.Thread(
            target=self._sniff_loop, daemon=True, name="netsecai-sniffer"
        )
        self._thread.start()
        logger.info("Sniffer started on interface=%s", self._interface or "default")
        return self.status()

    def stop(self) -> SnifferStatus:
        self._running = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=3)
        logger.info("Sniffer stopped. Captured %d packets.", len(self._packets))
        return self.status()

    def status(self) -> SnifferStatus:
        return SnifferStatus(
            running=self._running,
            interface=self._interface,
            packet_count=len(self._packets),
            start_time=self._start_time,
        )

    def get_packets(self, limit: int = 100) -> tuple[list[LivePacket], dict]:
        with self._lock:
            return self._packets[-limit:], dict(self._protocol_stats)

    def get_alerts(self) -> list[AnomalyAlert]:
        with self._lock:
            return list(self._alerts)

    def get_error(self) -> str | None:
        return self._error

    # ── Internal ────────────────────────────────────────────────────────────

    def _sniff_loop(self) -> None:
        """Simple Scapy sniff — same approach as a basic Wireshark capture."""
        try:
            from scapy.all import sniff
        except ImportError:
            self._error = "Scapy not installed — pip install scapy"
            logger.error("Scapy not installed — cannot start sniffer")
            self._running = False
            return

        max_packets = settings.SNIFFER_MAX_PACKETS

        try:
            logger.info(
                "Starting basic scapy sniff (iface=%s, max=%d)",
                self._interface or "default", max_packets,
            )

            # Simple sniff — same as the working sample.py
            # No special config, no Npcap flags — just basic sniff()
            kwargs = {
                "prn": self._handle_packet,
                "store": False,
                "count": max_packets,
                "stop_filter": lambda _: not self._running,
            }

            # Only pass iface if explicitly provided
            if self._interface:
                kwargs["iface"] = self._interface

            sniff(**kwargs)

        except PermissionError:
            self._error = "Permission denied — run the backend as Administrator"
            logger.error("Sniffer needs admin/root privileges")
        except OSError as exc:
            self._error = f"Sniffer error: {exc}"
            logger.error("Sniffer OS error: %s", exc)
        except Exception as exc:
            self._error = f"Sniffer error: {str(exc)[:200]}"
            logger.error("Sniffer loop error: %s", exc)
        finally:
            self._running = False

    def _handle_packet(self, pkt) -> None:
        if len(self._packets) >= settings.SNIFFER_MAX_PACKETS:
            self._running = False
            return

        try:
            from scapy.all import IP, IPv6, TCP, UDP, ICMP, DNS
        except ImportError:
            return

        record = LivePacket(
            index=len(self._packets),
            timestamp=float(pkt.time),
            src_ip=None,
            dst_ip=None,
            src_port=None,
            dst_port=None,
            protocol="Other",
            length=len(pkt),
            info=None,
        )

        # Layer 3
        if IP in pkt:
            record.src_ip = pkt[IP].src
            record.dst_ip = pkt[IP].dst
            record.protocol = "IP"
        elif IPv6 in pkt:
            record.src_ip = pkt[IPv6].src
            record.dst_ip = pkt[IPv6].dst
            record.protocol = "IPv6"

        # Layer 4
        if TCP in pkt:
            record.src_port = pkt[TCP].sport
            record.dst_port = pkt[TCP].dport
            record.protocol = "TCP"
            flags = str(pkt[TCP].flags)
            record.info = f"TCP {record.src_port}→{record.dst_port} [{flags}]"
            self._check_syn_flood(record.src_ip, flags)
            self._check_port_scan(record.src_ip, record.dst_port)
        elif UDP in pkt:
            record.src_port = pkt[UDP].sport
            record.dst_port = pkt[UDP].dport
            record.protocol = "UDP"
            record.info = f"UDP {record.src_port}→{record.dst_port}"
        elif ICMP in pkt:
            record.protocol = "ICMP"
            record.info = f"ICMP type={pkt[ICMP].type}"

        # DNS
        if DNS in pkt:
            record.protocol = "DNS"
            try:
                if pkt[DNS].qd:
                    record.info = f"DNS {pkt[DNS].qd.qname.decode()}"
            except Exception:
                pass

        with self._lock:
            self._packets.append(record)
            self._protocol_stats[record.protocol] += 1

    def _check_syn_flood(self, src_ip: str | None, flags: str) -> None:
        if not src_ip:
            return
        if "S" in flags and "A" not in flags:
            self._syn_counts[src_ip] += 1
            count = self._syn_counts[src_ip]
            if count == SYN_FLOOD_THRESHOLD:
                alert = AnomalyAlert(
                    type="syn_flood",
                    description=f"SYN flood detected from {src_ip} ({count}+ SYN packets)",
                    severity=RiskLevel.CRITICAL,
                    source_ip=src_ip,
                    details={"syn_count": count},
                )
                with self._lock:
                    self._alerts.append(alert)
                logger.warning("ALERT: SYN flood from %s", src_ip)

    def _check_port_scan(self, src_ip: str | None, dst_port: int | None) -> None:
        if not src_ip or dst_port is None:
            return
        self._port_probe[src_ip].add(dst_port)
        count = len(self._port_probe[src_ip])
        if count == PORT_SCAN_THRESHOLD:
            alert = AnomalyAlert(
                type="port_scan",
                description=f"Port scan detected from {src_ip} ({count} ports probed)",
                severity=RiskLevel.HIGH,
                source_ip=src_ip,
                details={"ports_probed": count},
            )
            with self._lock:
                self._alerts.append(alert)
            logger.warning("ALERT: Port scan from %s", src_ip)


# Singleton
sniffer_service = SnifferService()
