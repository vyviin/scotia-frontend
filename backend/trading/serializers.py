from decimal import Decimal

from rest_framework import serializers

from .models import DemoTrade


class DemoTradeCreateSerializer(serializers.ModelSerializer):
    side = serializers.ChoiceField(choices=DemoTrade.Side.choices)

    class Meta:
        model = DemoTrade
        fields = ["side", "symbol", "quantity", "entry_price"]

    def validate_symbol(self, value):
        value = value.strip().upper()
        if not value:
            raise serializers.ValidationError("Symbol is required.")
        return value

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than zero.")
        return value

    def validate_entry_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Entry price must be greater than zero.")
        return value


class DemoTradeSerializer(serializers.ModelSerializer):
    quantity = serializers.DecimalField(max_digits=12, decimal_places=4, coerce_to_string=False)
    entry_price = serializers.DecimalField(max_digits=12, decimal_places=4, coerce_to_string=False)

    class Meta:
        model = DemoTrade
        fields = ["id", "side", "symbol", "quantity", "entry_price", "created_at"]


class DemoTradeWithPnlSerializer(DemoTradeSerializer):
    unrealized_pnl = serializers.DecimalField(max_digits=16, decimal_places=4)

    class Meta(DemoTradeSerializer.Meta):
        fields = DemoTradeSerializer.Meta.fields + ["unrealized_pnl"]


def compute_unrealized_pnl(trade: DemoTrade, current_price: Decimal) -> Decimal:
    if trade.side == DemoTrade.Side.BUY:
        return (current_price - trade.entry_price) * trade.quantity
    return (trade.entry_price - current_price) * trade.quantity
