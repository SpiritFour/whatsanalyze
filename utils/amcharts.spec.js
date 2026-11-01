import { patchAmchartsEventDispatcher } from "./amcharts";

describe("patchAmchartsEventDispatcher", () => {
  it("guards isEnabled and dispatchImmediately when dispatcher is disposed", () => {
    class FakeEventDispatcher {
      constructor() {
        this._disposed = false;
        this.enabledCallCount = 0;
        this.dispatchedCallCount = 0;
      }

      isEnabled(_type) {
        if (this._disposed) {
          throw new Error("EventDispatcher is disposed");
        }
        this.enabledCallCount++;
        return true;
      }

      dispatchImmediately(_type, _event) {
        if (this._disposed) {
          throw new Error("EventDispatcher is disposed");
        }
        this.dispatchedCallCount++;
      }
    }

    const fakeAm4core = {
      EventDispatcher: FakeEventDispatcher,
    };

    patchAmchartsEventDispatcher(fakeAm4core);

    const dispatcher = new FakeEventDispatcher();

    // While active, works normally
    expect(dispatcher.isEnabled("up")).toBe(true);
    expect(dispatcher.enabledCallCount).toBe(1);
    dispatcher.dispatchImmediately("up", {});
    expect(dispatcher.dispatchedCallCount).toBe(1);

    // After dispose, returns false / no-ops instead of throwing
    dispatcher._disposed = true;
    expect(() => dispatcher.isEnabled("up")).not.toThrow();
    expect(dispatcher.isEnabled("up")).toBe(false);
    expect(() => dispatcher.dispatchImmediately("up", {})).not.toThrow();
    // Counts should not have incremented
    expect(dispatcher.enabledCallCount).toBe(1);
    expect(dispatcher.dispatchedCallCount).toBe(1);
  });

  it("handles null/undefined am4core safely", () => {
    expect(() => patchAmchartsEventDispatcher(null)).not.toThrow();
    expect(() => patchAmchartsEventDispatcher({})).not.toThrow();
  });
});
