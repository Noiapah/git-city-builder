export interface RenderSchedulerOptions {
  update: () => boolean;
  render: () => void;
  requestFrame?: (callback: FrameRequestCallback) => number;
  cancelFrame?: (handle: number) => void;
}

/** Coalesce scene changes and keep rendering only while camera damping is active. */
export function createRenderScheduler({
  update,
  render,
  requestFrame = requestAnimationFrame,
  cancelFrame = cancelAnimationFrame,
}: RenderSchedulerOptions) {
  let frame = 0;
  let enabled = true;
  let dirty = false;

  const queue = () => {
    if (enabled && !frame) frame = requestFrame(tick);
  };

  function tick() {
    frame = 0;
    if (!enabled) return;
    const cameraChanged = update();
    if (dirty || cameraChanged) render();
    dirty = false;
    if (cameraChanged) queue();
  }

  return {
    invalidate() {
      dirty = true;
      queue();
    },
    setEnabled(value: boolean) {
      if (enabled === value) return;
      enabled = value;
      if (enabled) {
        dirty = true;
        queue();
      } else if (frame) {
        cancelFrame(frame);
        frame = 0;
      }
    },
    dispose() {
      enabled = false;
      if (frame) cancelFrame(frame);
      frame = 0;
    },
  };
}
