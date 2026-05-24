from django.contrib import admin

from .models import DemoTrade, ReplayCandle


@admin.register(ReplayCandle)
class ReplayCandleAdmin(admin.ModelAdmin):
    list_display = ("symbol", "timeframe", "candle_index", "timestamp", "close", "volume")
    list_filter = ("symbol", "timeframe")
    ordering = ("symbol", "timeframe", "candle_index")


@admin.register(DemoTrade)
class DemoTradeAdmin(admin.ModelAdmin):
    list_display = ("id", "side", "symbol", "quantity", "entry_price", "created_at")
    list_filter = ("side", "symbol")
