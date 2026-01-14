/**
 * Storage buffer for GPU compute operations
 */

import type { GPUContext } from "./context"; // Need to import GPUContext type
import { generateEventId } from "./events";
import type { MemoryEvent } from "./events";

/**
 * Storage buffer class
 */
export class StorageBuffer {
  private device: GPUDevice;
  private buffer: GPUBuffer;
  private _byteSize: number;
  private context?: GPUContext; // Add context property

  constructor(device: GPUDevice, byteSize: number, context?: GPUContext) {
    this.device = device;
    this._byteSize = byteSize;
    this.context = context; // Store context

    // Create GPU buffer with INDEX usage to support index buffer operations
    this.buffer = device.createBuffer({
      size: byteSize,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC |
        GPUBufferUsage.INDEX,
    });

    if (this.context) {
      const allocateEvent: MemoryEvent = {
        type: "memory",
        timestamp: performance.now(),
        id: generateEventId(),
        resourceType: "buffer",
        size: byteSize,
        action: "allocate",
      };
      this.context.emitEvent(allocateEvent);
    }
  }

  /**
   * Get the underlying GPUBuffer
   */
  get gpuBuffer(): GPUBuffer {
    return this.buffer;
  }

  /**
   * Get the buffer size in bytes
   */
  get byteSize(): number {
    return this._byteSize;
  }

  /**
   * Write data to the buffer
   */
  write(data: ArrayBuffer | ArrayBufferView, offset = 0): void {
    // For ArrayBufferView (Float32Array, etc.), pass the underlying buffer with correct offset/length
    if (data instanceof ArrayBuffer) {
      this.device.queue.writeBuffer(this.buffer, offset, data);
    } else {
      // Pass view's buffer with byteOffset and byteLength to handle views correctly
      this.device.queue.writeBuffer(
        this.buffer, 
        offset, 
        data.buffer as ArrayBuffer, 
        data.byteOffset, 
        data.byteLength
      );
    }
  }

  /**
   * Dispose the buffer
   */
  dispose(): void {
    if (this.context) {
      const freeEvent: MemoryEvent = {
        type: "memory",
        timestamp: performance.now(),
        id: generateEventId(),
        resourceType: "buffer",
        size: this._byteSize,
        action: "free",
      };
      this.context.emitEvent(freeEvent);
    }
    this.buffer.destroy();
  }
}
