import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    VIRUSTOTAL_API_KEY: str = os.getenv("VIRUSTOTAL_API_KEY", "")
    ABUSEIPDB_API_KEY: str = os.getenv("ABUSEIPDB_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    PORT_SCAN_TIMEOUT: float = float(os.getenv("PORT_SCAN_TIMEOUT", "1.0"))
    PORT_SCAN_TOP_PORTS: list[int] = [
        21, 22, 23, 25, 53, 80, 110, 143, 443, 465,
        587, 993, 995, 3306, 3389, 5432, 6379, 8080, 8443, 27017
    ]

    SNIFFER_MAX_PACKETS: int = int(os.getenv("SNIFFER_MAX_PACKETS", "500"))
    SNIFFER_INTERFACE: str = os.getenv("SNIFFER_INTERFACE", "")  # empty = auto

    REQUEST_TIMEOUT: int = int(os.getenv("REQUEST_TIMEOUT", "10"))
    MAX_PCAP_SIZE_MB: int = int(os.getenv("MAX_PCAP_SIZE_MB", "50"))


settings = Settings()
