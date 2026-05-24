from django.urls import path

from . import views

urlpatterns = [
    path("replay/candles/", views.replay_candles, name="replay-candles"),
    path("trades/", views.create_trade, name="create-trade"),
    path("trades/pnl/", views.trades_pnl, name="trades-pnl"),
    path("tavus/session/", views.create_tavus_session, name="tavus-session"),
]
