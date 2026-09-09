import { test } from "node:test";
import assert from "node:assert/strict";
import { createRenderScheduler } from "./renderScheduler";

test("render scheduler coalesces changes and continues only while damping moves the camera", () => {
  const callbacks = new Map<number, FrameRequestCallback>();
  let nextFrame = 0;
  let renders = 0;
  let updates = 0;
  let moving = true;
  const scheduler = createRenderScheduler({
    update: () => {
      updates++;
      const changed = moving;
      moving = false;
      return changed;
    },
    render: () => renders++,
    requestFrame: (callback) => {
      callbacks.set(++nextFrame, callback);
      return nextFrame;
    },
    cancelFrame: (handle) => callbacks.delete(handle),
  });

  scheduler.invalidate();
  scheduler.invalidate();
  assert.equal(callbacks.size, 1);

  callbacks.get(1)!(0);
  callbacks.delete(1);
  assert.equal(renders, 1);
  assert.equal(callbacks.size, 1);

  callbacks.get(2)!(16);
  callbacks.delete(2);
  assert.equal(updates, 2);
  assert.equal(renders, 1);
  assert.equal(callbacks.size, 0);
});

test("render scheduler pauses queued work and redraws after resuming", () => {
  const callbacks = new Map<number, FrameRequestCallback>();
  let nextFrame = 0;
  let renders = 0;
  const scheduler = createRenderScheduler({
    update: () => false,
    render: () => renders++,
    requestFrame: (callback) => {
      callbacks.set(++nextFrame, callback);
      return nextFrame;
    },
    cancelFrame: (handle) => callbacks.delete(handle),
  });

  scheduler.invalidate();
  scheduler.setEnabled(false);
  assert.equal(callbacks.size, 0);

  scheduler.invalidate();
  assert.equal(callbacks.size, 0);
  scheduler.setEnabled(true);
  callbacks.get(2)!(0);
  callbacks.delete(2);
  assert.equal(renders, 1);
});
