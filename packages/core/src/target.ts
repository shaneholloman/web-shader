/**
 * Render target management
 */

import type { RenderTargetOptions, FilterMode, WrapMode, TextureFormat, RenderTargetUsage } from "./types";
import type { GPUContext } from "./context";
import { generateEventId } from "./events";
import type { MemoryEvent } from "./events";

/**
 * Maps our texture format strings to GPUTextureFormat
 */
function getGPUTextureFormat(format: TextureFormat): GPUTextureFormat {
  const formatMap: Record<TextureFormat, GPUTextureFormat> = {
    "rgba8unorm": "rgba8unorm",
    "rgba16float": "rgba16float",
    "r16float": "r16float",
    "rg16float": "rg16float",
    "r32float": "r32float",
  };
  return formatMap[format];
}

/**
 * Calculate texture size in bytes
 */
function calculateTextureSize(width: number, height: number, format: TextureFormat): number {
  const bytesPerPixel: Record<TextureFormat, number> = {
    "rgba8unorm": 4,
    "rgba16float": 8,
    "r16float": 2,
    "rg16float": 4,
    "r32float": 4,
  };
  return width * height * bytesPerPixel[format];
}

/**
 * Stable texture reference that survives resize operations.
 * The texture object reference remains the same while the underlying
 * GPU resource can be swapped out during resize.
 */
export class TextureReference {
  private _gpuTexture: GPUTexture;

  constructor(gpuTexture: GPUTexture) {
    this._gpuTexture = gpuTexture;
  }

  /**
   * Get the current GPU texture (for direct access)
   */
  get texture(): GPUTexture {
    return this._gpuTexture;
  }

  /**
   * Create a view of the current texture
   */
  createView(): GPUTextureView {
    return this._gpuTexture.createView();
  }

  /**
   * Update the internal GPU texture reference.
   * Called internally by RenderTarget during resize.
   * @internal
   */
  _updateTexture(newTexture: GPUTexture): void {
    this._gpuTexture = newTexture;
  }
}

/**
 * Render target class
 */
export class RenderTarget {
  private device: GPUDevice;
  private context?: GPUContext;
  private _gpuTexture!: GPUTexture;
  private _textureRef!: TextureReference;
  private _view!: GPUTextureView;
  private _sampler!: GPUSampler;
  private _width: number;
  private _height: number;
  private _format: TextureFormat;
  private _filter: FilterMode;
  private _wrap: WrapMode;
  private _usage: RenderTargetUsage;

  constructor(
    device: GPUDevice,
    width: number,
    height: number,
    options: RenderTargetOptions = {},
    context?: GPUContext
  ) {
    this.device = device;
    this.context = context;
    this._width = width;
    this._height = height;
    this._format = options.format || "rgba8unorm";
    this._filter = options.filter || "linear";
    this._wrap = options.wrap || "clamp";
    this._usage = options.usage || "render";

    // Create texture and view
    this.createTexture();
    this.createSampler();

    // Emit allocate event
    if (this.context) {
      const allocateEvent: MemoryEvent = {
        type: "memory",
        timestamp: performance.now(),
        id: generateEventId(),
        resourceType: "texture",
        size: calculateTextureSize(this._width, this._height, this._format),
        action: "allocate",
      };
      this.context.emitEvent(allocateEvent);
    }
  }

  private createTexture(): void {
    // Determine usage flags based on usage mode
    let usage = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC;
    
    if (this._usage === "render" || this._usage === "both") {
      usage |= GPUTextureUsage.RENDER_ATTACHMENT;
    }
    
    if (this._usage === "storage" || this._usage === "both") {
      usage |= GPUTextureUsage.STORAGE_BINDING;
    }
    
    this._gpuTexture = this.device.createTexture({
      size: { width: this._width, height: this._height },
      format: getGPUTextureFormat(this._format),
      usage,
    });
    
    // Create view from the new texture
    this._view = this._gpuTexture.createView();
    
    // Create or update the stable texture reference
    if (!this._textureRef) {
      this._textureRef = new TextureReference(this._gpuTexture);
    } else {
      this._textureRef._updateTexture(this._gpuTexture);
    }
  }

  private createSampler(): void {
    const addressMode = this._wrap === "clamp" ? "clamp-to-edge" : 
                       this._wrap === "repeat" ? "repeat" : "mirror-repeat";
    
    this._sampler = this.device.createSampler({
      magFilter: this._filter,
      minFilter: this._filter,
      addressModeU: addressMode,
      addressModeV: addressMode,
    });
  }

  /**
   * Get the stable texture reference.
   * This reference remains valid across resize operations.
   * Use this when passing textures to uniforms.
   */
  get texture(): TextureReference {
    return this._textureRef;
  }

  /**
   * Get the current GPU texture directly.
   * Note: This reference becomes invalid after resize.
   * Prefer using .texture for uniform bindings.
   */
  get gpuTexture(): GPUTexture {
    return this._gpuTexture;
  }

  /**
   * Get the texture view.
   * Returns cached view which is updated automatically during resize.
   */
  get view(): GPUTextureView {
    return this._view;
  }

  /**
   * Get the sampler
   */
  get sampler(): GPUSampler {
    return this._sampler;
  }

  /**
   * Get the width
   */
  get width(): number {
    return this._width;
  }

  /**
   * Get the height
   */
  get height(): number {
    return this._height;
  }

  /**
   * Get the format
   */
  get format(): TextureFormat {
    return this._format;
  }

  /**
   * Get the usage mode
   */
  get usage(): RenderTargetUsage {
    return this._usage;
  }

  /**
   * Resize the render target.
   * The stable texture reference is automatically updated,
   * so uniform bindings remain valid.
   */
  resize(width: number, height: number): void {
    if (width === this._width && height === this._height) {
      return;
    }

    // Destroy old texture
    this._gpuTexture.destroy();

    // Update size and recreate
    this._width = width;
    this._height = height;
    this.createTexture();

    // Emit resize event
    if (this.context) {
      const resizeEvent: MemoryEvent = {
        type: "memory",
        timestamp: performance.now(),
        id: generateEventId(),
        resourceType: "texture",
        size: calculateTextureSize(this._width, this._height, this._format),
        action: "resize",
      };
      this.context.emitEvent(resizeEvent);
    }
  }

  /**
   * Read pixels from the render target
   */
  async readPixels(
    x = 0,
    y = 0,
    width = this._width,
    height = this._height
  ): Promise<Uint8Array | Float32Array> {
    const bytesPerPixel = this._format === "rgba8unorm" ? 4 : 
                          this._format === "r16float" ? 2 :
                          this._format === "rg16float" ? 4 :
                          this._format === "rgba16float" ? 8 :
                          this._format === "r32float" ? 4 : 4;
    
    const bytesPerRow = Math.ceil((width * bytesPerPixel) / 256) * 256;
    const bufferSize = bytesPerRow * height;

    const buffer = this.device.createBuffer({
      size: bufferSize,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    const encoder = this.device.createCommandEncoder();
    encoder.copyTextureToBuffer(
      { texture: this._gpuTexture, origin: { x, y, z: 0 } },
      { buffer, bytesPerRow },
      { width, height, depthOrArrayLayers: 1 }
    );
    this.device.queue.submit([encoder.finish()]);

    await buffer.mapAsync(GPUMapMode.READ);
    const arrayBuffer = buffer.getMappedRange();
    
    // Create appropriate typed array based on format
    const isFloat = this._format !== "rgba8unorm";
    const data = isFloat 
      ? new Float32Array(arrayBuffer.slice(0))
      : new Uint8Array(arrayBuffer.slice(0));
    
    buffer.unmap();
    buffer.destroy();

    return data;
  }

  /**
   * Dispose the render target
   */
  dispose(): void {
    // Emit free event
    if (this.context) {
      const freeEvent: MemoryEvent = {
        type: "memory",
        timestamp: performance.now(),
        id: generateEventId(),
        resourceType: "texture",
        size: calculateTextureSize(this._width, this._height, this._format),
        action: "free",
      };
      this.context.emitEvent(freeEvent);
    }
    this._gpuTexture.destroy();
  }
}
