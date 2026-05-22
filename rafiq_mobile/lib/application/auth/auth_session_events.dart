import 'dart:async';

enum AuthSessionEvent {
  expired,
}

class AuthSessionEvents {
  final StreamController<AuthSessionEvent> _controller =
      StreamController<AuthSessionEvent>.broadcast();

  Stream<AuthSessionEvent> get stream => _controller.stream;

  void notifyExpired() {
    if (!_controller.isClosed) {
      _controller.add(AuthSessionEvent.expired);
    }
  }

  void dispose() {
    _controller.close();
  }
}
