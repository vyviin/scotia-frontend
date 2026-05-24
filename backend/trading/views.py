from decimal import Decimal, InvalidOperation

from datetime import timezone as dt_timezone

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import DemoTrade, ReplayCandle
from .serializers import (
    DemoTradeCreateSerializer,
    DemoTradeSerializer,
    compute_unrealized_pnl,
)
from .tavus import TavusAPIError, TavusConfigError, TavusTimeoutError, create_tavus_conversation


def _format_timestamp(dt):
    if timezone.is_aware(dt):
        dt = dt.astimezone(dt_timezone.utc)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


@api_view(["GET"])
def replay_candles(request):
    symbol = request.query_params.get("symbol", "").strip().upper()
    timeframe = request.query_params.get("timeframe", "").strip()

    if not symbol:
        return Response({"error": "Query parameter 'symbol' is required."}, status=status.HTTP_400_BAD_REQUEST)
    if not timeframe:
        return Response({"error": "Query parameter 'timeframe' is required."}, status=status.HTTP_400_BAD_REQUEST)

    candles = ReplayCandle.objects.filter(symbol=symbol, timeframe=timeframe).order_by("candle_index")

    return Response(
        {
            "symbol": symbol,
            "timeframe": timeframe,
            "candles": [
                {
                    "index": candle.candle_index,
                    "timestamp": _format_timestamp(candle.timestamp),
                    "open": float(candle.open),
                    "high": float(candle.high),
                    "low": float(candle.low),
                    "close": float(candle.close),
                    "volume": candle.volume,
                }
                for candle in candles
            ],
        }
    )


@api_view(["POST"])
def create_trade(request):
    serializer = DemoTradeCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    trade = serializer.save()
    return Response(DemoTradeSerializer(trade).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
def trades_pnl(request):
    symbol = request.query_params.get("symbol", "").strip().upper()
    current_price_raw = request.query_params.get("current_price", "").strip()

    if not symbol:
        return Response({"error": "Query parameter 'symbol' is required."}, status=status.HTTP_400_BAD_REQUEST)
    if not current_price_raw:
        return Response({"error": "Query parameter 'current_price' is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        current_price = Decimal(current_price_raw)
    except InvalidOperation:
        return Response({"error": "Query parameter 'current_price' must be a valid number."}, status=status.HTTP_400_BAD_REQUEST)

    trades = DemoTrade.objects.filter(symbol=symbol)
    open_trades = []
    total_unrealized_pnl = Decimal("0")

    for trade in trades:
        unrealized_pnl = compute_unrealized_pnl(trade, current_price)
        total_unrealized_pnl += unrealized_pnl
        open_trades.append(
            {
                **DemoTradeSerializer(trade).data,
                "unrealized_pnl": float(unrealized_pnl),
            }
        )

    return Response(
        {
            "symbol": symbol,
            "current_price": float(current_price),
            "open_trades": open_trades,
            "total_unrealized_pnl": float(total_unrealized_pnl),
        }
    )


@api_view(["POST"])
def create_tavus_session(request):
    try:
        result = create_tavus_conversation()
        return Response(result, status=status.HTTP_200_OK)
    except TavusConfigError:
        return Response(
            {
                "error": "Tavus is not configured. Missing TAVUS_API_KEY, TAVUS_REPLICA_ID, or TAVUS_PERSONA_ID."
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    except (TavusAPIError, TavusTimeoutError) as exc:
        return Response(
            {
                "error": "Could not create Tavus conversation.",
                "details": str(exc),
            },
            status=status.HTTP_502_BAD_GATEWAY,
        )
