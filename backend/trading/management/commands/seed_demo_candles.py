from datetime import datetime, timedelta, timezone as dt_timezone
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from trading.models import ReplayCandle

SYMBOL = "SPY"
SESSION_START = datetime(2025, 5, 23, 9, 30)

# Base OHLCV pattern (24 candles) — prices around 408–415 for SPY demo data
BASE_CANDLES = [
    {"open": "410.00", "high": "411.00", "low": "409.50", "close": "410.75", "volume": 123456},
    {"open": "410.75", "high": "412.10", "low": "410.20", "close": "411.80", "volume": 134200},
    {"open": "411.80", "high": "412.50", "low": "411.00", "close": "411.25", "volume": 98765},
    {"open": "411.25", "high": "411.90", "low": "410.50", "close": "410.90", "volume": 112300},
    {"open": "410.90", "high": "411.40", "low": "409.80", "close": "410.10", "volume": 145600},
    {"open": "410.10", "high": "410.85", "low": "409.20", "close": "409.55", "volume": 156789},
    {"open": "409.55", "high": "410.30", "low": "408.90", "close": "410.00", "volume": 132100},
    {"open": "410.00", "high": "411.20", "low": "409.75", "close": "411.00", "volume": 118900},
    {"open": "411.00", "high": "412.00", "low": "410.60", "close": "411.90", "volume": 127450},
    {"open": "411.90", "high": "413.10", "low": "411.50", "close": "412.80", "volume": 141230},
    {"open": "412.80", "high": "413.50", "low": "412.10", "close": "412.40", "volume": 109876},
    {"open": "412.40", "high": "413.00", "low": "411.80", "close": "412.95", "volume": 99887},
    {"open": "412.95", "high": "414.00", "low": "412.50", "close": "413.70", "volume": 153400},
    {"open": "413.70", "high": "414.50", "low": "413.20", "close": "414.10", "volume": 162300},
    {"open": "414.10", "high": "414.80", "low": "413.60", "close": "414.25", "volume": 138765},
    {"open": "414.25", "high": "415.00", "low": "413.90", "close": "414.60", "volume": 147890},
    {"open": "414.60", "high": "415.20", "low": "414.00", "close": "414.15", "volume": 121100},
    {"open": "414.15", "high": "414.90", "low": "413.50", "close": "413.80", "volume": 115432},
    {"open": "413.80", "high": "414.40", "low": "413.10", "close": "414.00", "volume": 104567},
    {"open": "414.00", "high": "414.75", "low": "413.40", "close": "414.50", "volume": 97654},
    {"open": "414.50", "high": "415.10", "low": "414.00", "close": "414.85", "volume": 88900},
    {"open": "414.85", "high": "415.30", "low": "414.20", "close": "414.40", "volume": 92345},
    {"open": "414.40", "high": "414.95", "low": "413.85", "close": "414.10", "volume": 86789},
    {"open": "414.10", "high": "414.60", "low": "413.50", "close": "413.95", "volume": 81234},
]

TIMEFRAME_MINUTES = {
    "15m": 15,
    "1m": 1,
}


class Command(BaseCommand):
    help = "Seed hardcoded demo SPY replay candles (15m and 1m timeframes)."

    def handle(self, *args, **options):
        created_count = 0
        updated_count = 0

        for timeframe, minutes in TIMEFRAME_MINUTES.items():
            for index, candle in enumerate(BASE_CANDLES):
                ts = SESSION_START + timedelta(minutes=minutes * index)
                aware_ts = timezone.make_aware(ts, timezone=dt_timezone.utc)

                _, created = ReplayCandle.objects.update_or_create(
                    symbol=SYMBOL,
                    timeframe=timeframe,
                    candle_index=index,
                    defaults={
                        "timestamp": aware_ts,
                        "open": Decimal(candle["open"]),
                        "high": Decimal(candle["high"]),
                        "low": Decimal(candle["low"]),
                        "close": Decimal(candle["close"]),
                        "volume": candle["volume"],
                    },
                )
                if created:
                    created_count += 1
                else:
                    updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {SYMBOL} candles: {created_count} created, {updated_count} updated "
                f"({len(BASE_CANDLES)} per timeframe × {len(TIMEFRAME_MINUTES)} timeframes)."
            )
        )
