/**
 * amCharts 4 registers a global document-level touch listener that processes
 * pointer gestures. When a chart unmounts during an active touch, the chart and
 * its interaction objects are disposed, but the global listener still triggers
 * on touchend. In amCharts 4, EventDispatcher.prototype.isEnabled throws an
 * unhandled "EventDispatcher is disposed" Error if queried after disposal.
 *
 * Guarding isEnabled and dispatchImmediately prevents crashes when gesture
 * cleanup races against route navigation or component unmount.
 */
export function patchAmchartsEventDispatcher(am4core) {
  if (!am4core?.EventDispatcher?.prototype) return;
  const proto = am4core.EventDispatcher.prototype;
  const originalIsEnabled = proto.isEnabled;
  proto.isEnabled = function (type) {
    if (this._disposed) return false;
    return originalIsEnabled.call(this, type);
  };
  const originalDispatchImmediately = proto.dispatchImmediately;
  proto.dispatchImmediately = function (type, event) {
    if (this._disposed) return;
    return originalDispatchImmediately.call(this, type, event);
  };
}
