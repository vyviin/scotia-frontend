from django.db import models


class ReplayCandle(models.Model):
    symbol = models.CharField(max_length=20)
    timeframe = models.CharField(max_length=10)
    timestamp = models.DateTimeField()
    open = models.DecimalField(max_digits=12, decimal_places=4)
    high = models.DecimalField(max_digits=12, decimal_places=4)
    low = models.DecimalField(max_digits=12, decimal_places=4)
    close = models.DecimalField(max_digits=12, decimal_places=4)
    volume = models.BigIntegerField()
    candle_index = models.IntegerField()

    class Meta:
        ordering = ["candle_index"]
        constraints = [
            models.UniqueConstraint(
                fields=["symbol", "timeframe", "candle_index"],
                name="unique_candle_per_symbol_timeframe_index",
            )
        ]

    def __str__(self):
        return f"{self.symbol} {self.timeframe} #{self.candle_index}"


class DemoTrade(models.Model):
    class Side(models.TextChoices):
        BUY = "BUY", "Buy"
        SELL = "SELL", "Sell"

    side = models.CharField(max_length=4, choices=Side.choices)
    symbol = models.CharField(max_length=20)
    quantity = models.DecimalField(max_digits=12, decimal_places=4)
    entry_price = models.DecimalField(max_digits=12, decimal_places=4)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.side} {self.quantity} {self.symbol} @ {self.entry_price}"
