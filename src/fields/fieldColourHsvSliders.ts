/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A colour input field with HSV + RGB sliders, a hex input and a live preview.
 * Based on the @blockly/field-colour-hsv-sliders plugin.
 */

import * as Blockly from "blockly/core";
import { FieldColour } from "blockly/core";

// Experimental API: https://developer.mozilla.org/en-US/docs/Web/API/EyeDropper
declare interface EyeDropper {
  open: () => Promise<{ sRGBHex: string }>;
}
declare global {
  interface Window {
    EyeDropper?: { new (): EyeDropper };
  }
}

type ColourMode = "hsv" | "rgb";

/** A colour field that opens HSV and RGB slider widgets when clicked. */
export class FieldColourHsvSliders extends FieldColour {
  /** Max value of the hue slider. */
  private static readonly HUE_SLIDER_MAX = 360;

  /** Max value of the saturation slider. */
  private static readonly SATURATION_SLIDER_MAX = 100;

  /** Max value of the brightness slider. */
  private static readonly BRIGHTNESS_SLIDER_MAX = 100;

  /** Max value of the RGB sliders. */
  private static readonly RGB_SLIDER_MAX = 255;

  /** Insets the slider track gradients so they align with the thumb center. */
  static readonly THUMB_RADIUS = 12;

  /** The field value when the editor was opened (used to cancel edits). */
  protected valueWhenEditorWasOpened: string | null = null;

  /** Event bindings to unbind when disposing. */
  private boundEvents: Blockly.browserEvents.Data[] = [];

  /** Which set of sliders is currently shown. */
  private mode: ColourMode = "hsv";

  private dropdownContainer: HTMLDivElement | null = null;
  private previewSwatch: HTMLDivElement | null = null;
  private hexInput: HTMLInputElement | null = null;
  private hsvTab: HTMLButtonElement | null = null;
  private rgbTab: HTMLButtonElement | null = null;
  private hsvGroup: HTMLDivElement | null = null;
  private rgbGroup: HTMLDivElement | null = null;
  private hueReadout: HTMLSpanElement | null = null;
  private saturationReadout: HTMLSpanElement | null = null;
  private brightnessReadout: HTMLSpanElement | null = null;
  private hueSlider: HTMLInputElement | null = null;
  private saturationSlider: HTMLInputElement | null = null;
  private brightnessSlider: HTMLInputElement | null = null;
  private redReadout: HTMLSpanElement | null = null;
  private greenReadout: HTMLSpanElement | null = null;
  private blueReadout: HTMLSpanElement | null = null;
  private redSlider: HTMLInputElement | null = null;
  private greenSlider: HTMLInputElement | null = null;
  private blueSlider: HTMLInputElement | null = null;

  /** Creates and shows the colour editor. */
  protected override showEditor_(): void {
    this.createDropdown();
    if (!this.dropdownContainer) {
      throw new Error("Failed to initialize the colour editor.");
    }

    Blockly.DropDownDiv.getContentDiv().appendChild(this.dropdownContainer);

    Blockly.DropDownDiv.showPositionedByField(
      this,
      this.dropdownDispose.bind(this),
    );

    this.valueWhenEditorWasOpened = this.value_;

    setTimeout(() => {
      this.hexInput?.focus({ preventScroll: true });
    }, 250);
  }

  /** Creates a slider row and returns its parts. */
  private createSliderRow(
    name: string,
    max: number,
    step: number,
    container: HTMLElement,
  ): { readout: HTMLSpanElement; slider: HTMLInputElement } {
    const row = document.createElement("div");
    row.classList.add("fieldColourSliderRow");

    const label = document.createElement("div");
    label.classList.add("fieldColourSliderLabel");
    const labelText = document.createElement("span");
    labelText.textContent = name;
    const readout = document.createElement("span");
    readout.classList.add("fieldColourSliderReadout");
    label.appendChild(labelText);
    label.appendChild(readout);
    row.appendChild(label);

    const slider = document.createElement("input");
    slider.classList.add("fieldColourSlider");
    slider.type = "range";
    slider.min = "0";
    slider.max = String(max);
    slider.step = String(step);
    slider.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        Blockly.DropDownDiv.hideIfOwner(this);
        Blockly.getFocusManager?.()?.focusNode(this);
      } else if (e.key === "Escape") {
        this.setValue(this.valueWhenEditorWasOpened);
      }
    });
    row.appendChild(slider);
    container.appendChild(row);

    return { readout, slider };
  }

  /** Creates the colour editor dropdown and adds event listeners. */
  private createDropdown(): void {
    const container = document.createElement("div");
    container.classList.add("fieldColourSliderContainer");

    // Colour preview + hex input row.
    const previewRow = document.createElement("div");
    previewRow.classList.add("fieldColourPreviewRow");
    this.previewSwatch = document.createElement("div");
    this.previewSwatch.classList.add("fieldColourPreviewSwatch");
    this.hexInput = document.createElement("input");
    this.hexInput.classList.add("fieldColourHexInput");
    this.hexInput.type = "text";
    this.hexInput.spellcheck = false;
    Blockly.utils.aria.setState(
      this.hexInput,
      Blockly.utils.aria.State.LABEL,
      "Hex colour",
    );
    previewRow.appendChild(this.previewSwatch);
    previewRow.appendChild(this.hexInput);
    container.appendChild(previewRow);

    // HSB / RGB mode toggle.
    const modeToggle = document.createElement("div");
    modeToggle.classList.add("fieldColourModeToggle");
    this.hsvTab = document.createElement("button");
    this.hsvTab.type = "button";
    this.hsvTab.classList.add("fieldColourModeTab", "active");
    this.hsvTab.textContent = "HSB";
    this.rgbTab = document.createElement("button");
    this.rgbTab.type = "button";
    this.rgbTab.classList.add("fieldColourModeTab");
    this.rgbTab.textContent = "RGB";
    modeToggle.appendChild(this.hsvTab);
    modeToggle.appendChild(this.rgbTab);
    container.appendChild(modeToggle);

    // HSB sliders.
    this.hsvGroup = document.createElement("div");
    this.hsvGroup.classList.add("fieldColourSliderGroup");
    const hue = this.createSliderRow(
      "Hue",
      FieldColourHsvSliders.HUE_SLIDER_MAX,
      2,
      this.hsvGroup,
    );
    this.hueReadout = hue.readout;
    this.hueSlider = hue.slider;
    const saturation = this.createSliderRow(
      "Saturation",
      FieldColourHsvSliders.SATURATION_SLIDER_MAX,
      1,
      this.hsvGroup,
    );
    this.saturationReadout = saturation.readout;
    this.saturationSlider = saturation.slider;
    const brightness = this.createSliderRow(
      "Brightness",
      FieldColourHsvSliders.BRIGHTNESS_SLIDER_MAX,
      1,
      this.hsvGroup,
    );
    this.brightnessReadout = brightness.readout;
    this.brightnessSlider = brightness.slider;
    container.appendChild(this.hsvGroup);

    // RGB sliders.
    this.rgbGroup = document.createElement("div");
    this.rgbGroup.classList.add("fieldColourSliderGroup", "hidden");
    const red = this.createSliderRow(
      "Red",
      FieldColourHsvSliders.RGB_SLIDER_MAX,
      1,
      this.rgbGroup,
    );
    this.redReadout = red.readout;
    this.redSlider = red.slider;
    const green = this.createSliderRow(
      "Green",
      FieldColourHsvSliders.RGB_SLIDER_MAX,
      1,
      this.rgbGroup,
    );
    this.greenReadout = green.readout;
    this.greenSlider = green.slider;
    const blue = this.createSliderRow(
      "Blue",
      FieldColourHsvSliders.RGB_SLIDER_MAX,
      1,
      this.rgbGroup,
    );
    this.blueReadout = blue.readout;
    this.blueSlider = blue.slider;
    container.appendChild(this.rgbGroup);

    this.boundEvents.push(
      Blockly.browserEvents.conditionalBind(
        this.hueSlider,
        "input",
        this,
        this.onSliderChange,
      ),
    );
    this.boundEvents.push(
      Blockly.browserEvents.conditionalBind(
        this.saturationSlider,
        "input",
        this,
        this.onSliderChange,
      ),
    );
    this.boundEvents.push(
      Blockly.browserEvents.conditionalBind(
        this.brightnessSlider,
        "input",
        this,
        this.onSliderChange,
      ),
    );
    this.boundEvents.push(
      Blockly.browserEvents.conditionalBind(
        this.redSlider,
        "input",
        this,
        this.onSliderChange,
      ),
    );
    this.boundEvents.push(
      Blockly.browserEvents.conditionalBind(
        this.greenSlider,
        "input",
        this,
        this.onSliderChange,
      ),
    );
    this.boundEvents.push(
      Blockly.browserEvents.conditionalBind(
        this.blueSlider,
        "input",
        this,
        this.onSliderChange,
      ),
    );

    // Hex input events.
    this.boundEvents.push(
      Blockly.browserEvents.conditionalBind(
        this.hexInput,
        "input",
        this,
        this.onHexInput,
      ),
    );
    this.hexInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.commitHexInput();
        Blockly.DropDownDiv.hideIfOwner(this);
        Blockly.getFocusManager?.()?.focusNode(this);
      } else if (e.key === "Escape") {
        this.setValue(this.valueWhenEditorWasOpened);
        this.updateControls();
      }
    });
    this.hexInput.addEventListener("blur", () => {
      this.commitHexInput();
    });

    // Mode toggle events.
    this.hsvTab.addEventListener("click", () => this.setMode("hsv"));
    this.rgbTab.addEventListener("click", () => this.setMode("rgb"));

    if (window.EyeDropper) {
      // Add an eyedropper button if the API is available.
      const button = document.createElement("button");
      button.type = "button";
      button.classList.add("fieldColourEyedropper");
      button.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          this.setValue(this.valueWhenEditorWasOpened);
        }
      });
      container.appendChild(document.createElement("hr"));
      container.appendChild(button);
      this.boundEvents.push(
        Blockly.browserEvents.conditionalBind(
          button,
          "click",
          this,
          this.onEyedropperEvent,
        ),
      );
    }

    this.dropdownContainer = container;

    this.updateControls();
  }

  /** Updates the field's ARIA roles and label. */
  override recomputeAriaContext(): boolean {
    const shouldCustomize = super.recomputeAriaContext();
    if (!shouldCustomize) return false;
    Blockly.utils.aria.setState(
      this.getFocusableElement(),
      Blockly.utils.aria.State.HASPOPUP,
      "menu",
    );
    return true;
  }

  /** Disposes of the editor's events and DOM references. */
  private dropdownDispose(): void {
    for (const event of this.boundEvents) {
      Blockly.browserEvents.unbind(event);
    }
    this.boundEvents.length = 0;
    // Commit any pending hex input (e.g. the user clicked away mid-typing).
    this.commitHexInput();
    this.dropdownContainer = null;
    this.previewSwatch = null;
    this.hexInput = null;
    this.hsvTab = null;
    this.rgbTab = null;
    this.hsvGroup = null;
    this.rgbGroup = null;
    this.hueReadout = null;
    this.hueSlider = null;
    this.saturationReadout = null;
    this.saturationSlider = null;
    this.brightnessReadout = null;
    this.brightnessSlider = null;
    this.redReadout = null;
    this.redSlider = null;
    this.greenReadout = null;
    this.greenSlider = null;
    this.blueReadout = null;
    this.blueSlider = null;

    if (
      this.sourceBlock_ &&
      Blockly.Events.isEnabled() &&
      this.valueWhenEditorWasOpened !== null &&
      this.valueWhenEditorWasOpened !== this.value_
    ) {
      // The user has finished editing; fire a change event with the final value.
      Blockly.Events.fire(
        new (Blockly.Events.get(Blockly.Events.BLOCK_CHANGE))(
          this.sourceBlock_,
          "field",
          this.name || null,
          this.valueWhenEditorWasOpened,
          this.value_,
        ),
      );
      this.valueWhenEditorWasOpened = null;
    }
  }

  /** Updates the field value from the active slider set. */
  private onSliderChange(event?: Event): void {
    this.setIntermediateValue(
      this.mode === "hsv"
        ? this.currentHsvHex()
        : this.currentRgbHex(),
    );
    this.updateControls();
  }

  /** Returns the hex colour represented by the HSB sliders. */
  private currentHsvHex(): string {
    if (!this.hueSlider || !this.saturationSlider || !this.brightnessSlider) {
      throw new Error("The HSB sliders are missing.");
    }
    const hue = parseFloat(this.hueSlider.value);
    const saturation =
      parseFloat(this.saturationSlider.value) /
      FieldColourHsvSliders.SATURATION_SLIDER_MAX;
    const brightness =
      (parseFloat(this.brightnessSlider.value) /
        FieldColourHsvSliders.BRIGHTNESS_SLIDER_MAX) *
      255;
    return Blockly.utils.colour.hsvToHex(hue, saturation, brightness);
  }

  /** Returns the hex colour represented by the RGB sliders. */
  private currentRgbHex(): string {
    if (!this.redSlider || !this.greenSlider || !this.blueSlider) {
      throw new Error("The RGB sliders are missing.");
    }
    const red = parseFloat(this.redSlider.value);
    const green = parseFloat(this.greenSlider.value);
    const blue = parseFloat(this.blueSlider.value);
    return Blockly.utils.colour.rgbToHex(red, green, blue);
  }

  /** Live-updates the preview swatch as the user types hex. */
  private onHexInput(): void {
    if (!this.hexInput) return;
    const value = this.hexInput.value.trim();
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)) {
      this.hexInput.classList.remove("fieldColourHexInputInvalid");
      const parsed = Blockly.utils.colour.parse(value);
      if (parsed && this.previewSwatch) {
        // Preview only; don't commit until the user confirms.
        this.previewSwatch.style.background = parsed;
      }
    } else {
      this.hexInput.classList.add("fieldColourHexInputInvalid");
    }
  }

  /** Commits the current hex input value to the field if it is valid. */
  private commitHexInput(): void {
    if (!this.hexInput) return;
    const value = this.hexInput.value.trim();
    if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)) return;
    const parsed = Blockly.utils.colour.parse(value);
    if (!parsed) return;
    this.hexInput.classList.remove("fieldColourHexInputInvalid");
    this.setIntermediateValue(parsed);
    this.updateControls();
  }

  /** Picks a colour with the eyedropper and applies it. */
  private onEyedropperEvent(event?: Event): void {
    if (window.EyeDropper) {
      const eyeDropper = new window.EyeDropper();
      eyeDropper.open().then(
        (result) => {
          this.setIntermediateValue(result.sRGBHex);
          this.updateControls();
        },
        // Ignore cancellation.
        () => {},
      );
    }
  }

  private setIntermediateValue(value: string): void {
    // Set the value without firing a normal change event (it isn't confirmed
    // until the editor closes), but do fire an intermediate-change event.
    const oldValue = this.value_;
    this.setValue(value, false);
    if (
      this.sourceBlock_ &&
      Blockly.Events.isEnabled() &&
      this.value_ !== oldValue
    ) {
      // Lets listeners know the value is changing but not yet final.
      Blockly.Events.fire(
        new (Blockly.Events.get(
          Blockly.Events.BLOCK_FIELD_INTERMEDIATE_CHANGE,
        ))(this.sourceBlock_, this.name || null, oldValue, this.value_),
      );
    }
  }

  /** Switches between the HSB and RGB slider sets. */
  private setMode(mode: ColourMode): void {
    this.mode = mode;
    if (this.hsvGroup) {
      this.hsvGroup.classList.toggle("hidden", mode !== "hsv");
    }
    if (this.rgbGroup) {
      this.rgbGroup.classList.toggle("hidden", mode !== "rgb");
    }
    if (this.hsvTab) {
      this.hsvTab.classList.toggle("active", mode === "hsv");
    }
    if (this.rgbTab) {
      this.rgbTab.classList.toggle("active", mode === "rgb");
    }
  }

  /** Syncs all editor controls with the current field value. */
  private updateControls(): void {
    if (!this.previewSwatch || !this.hexInput) return;

    const hex = this.getValue() ?? "#ffffff";
    const rgb = Blockly.utils.colour.hexToRgb(hex);

    this.previewSwatch.style.background = hex;
    if (!this.hexInput.classList.contains("fieldColourHexInputInvalid")) {
      this.hexInput.value = hex;
    }

    const hsv = FieldColourHsvSliders.rgbToHsv(rgb[0], rgb[1], rgb[2]);

    if (this.hueSlider) {
      this.hueSlider.value = String(
        Math.round(hsv.h * FieldColourHsvSliders.HUE_SLIDER_MAX),
      );
    }
    if (this.saturationSlider) {
      this.saturationSlider.value = String(
        Math.round(hsv.s * FieldColourHsvSliders.SATURATION_SLIDER_MAX),
      );
    }
    if (this.brightnessSlider) {
      this.brightnessSlider.value = String(
        Math.round(hsv.v * FieldColourHsvSliders.BRIGHTNESS_SLIDER_MAX),
      );
    }
    if (this.redSlider) this.redSlider.value = String(rgb[0]);
    if (this.greenSlider) this.greenSlider.value = String(rgb[1]);
    if (this.blueSlider) this.blueSlider.value = String(rgb[2]);

    this.renderReadouts();
    this.renderSliderTracks();
  }

  /** Updates the readouts to match the slider values. */
  private renderReadouts(): void {
    if (this.hueReadout) {
      this.hueReadout.textContent = this.hueSlider?.value ?? "";
    }
    if (this.saturationReadout) {
      this.saturationReadout.textContent = this.saturationSlider?.value ?? "";
    }
    if (this.brightnessReadout) {
      this.brightnessReadout.textContent =
        this.brightnessSlider?.value ?? "";
    }
    if (this.redReadout) {
      this.redReadout.textContent = this.redSlider?.value ?? "";
    }
    if (this.greenReadout) {
      this.greenReadout.textContent = this.greenSlider?.value ?? "";
    }
    if (this.blueReadout) {
      this.blueReadout.textContent = this.blueSlider?.value ?? "";
    }
  }

  /** Updates the gradient backgrounds of the slider tracks. */
  private renderSliderTracks(): void {
    if (
      !this.hueSlider ||
      !this.saturationSlider ||
      !this.brightnessSlider ||
      !this.redSlider ||
      !this.greenSlider ||
      !this.blueSlider
    ) {
      return;
    }

    const h = parseFloat(this.hueSlider.value);
    const s =
      parseFloat(this.saturationSlider.value) /
      FieldColourHsvSliders.SATURATION_SLIDER_MAX;
    const v =
      (parseFloat(this.brightnessSlider.value) /
        FieldColourHsvSliders.BRIGHTNESS_SLIDER_MAX) *
      255;
    const r = parseFloat(this.redSlider.value);
    const g = parseFloat(this.greenSlider.value);
    const b = parseFloat(this.blueSlider.value);

    // The hue slider needs intermediate gradient control points to include all
    // colours of the rainbow.
    let hueGradient = "linear-gradient(to right, ";
    hueGradient +=
      Blockly.utils.colour.hsvToHex(0, s, v) +
      ` ${FieldColourHsvSliders.THUMB_RADIUS}px, `;
    hueGradient += Blockly.utils.colour.hsvToHex(60, s, v) + ", ";
    hueGradient += Blockly.utils.colour.hsvToHex(120, s, v) + ", ";
    hueGradient += Blockly.utils.colour.hsvToHex(180, s, v) + ", ";
    hueGradient += Blockly.utils.colour.hsvToHex(240, s, v) + ", ";
    hueGradient += Blockly.utils.colour.hsvToHex(300, s, v) + ", ";
    hueGradient +=
      Blockly.utils.colour.hsvToHex(360, s, v) +
      ` calc(100% - ${FieldColourHsvSliders.THUMB_RADIUS}px))`;
    this.hueSlider.style.setProperty("--slider-track-background", hueGradient);

    // The saturation slider only needs gradient control points at each end.
    let saturationGradient = "linear-gradient(to right, ";
    saturationGradient +=
      Blockly.utils.colour.hsvToHex(h, 0, v) +
      ` ${FieldColourHsvSliders.THUMB_RADIUS}px, `;
    saturationGradient +=
      Blockly.utils.colour.hsvToHex(h, 1, v) +
      ` calc(100% - ${FieldColourHsvSliders.THUMB_RADIUS}px))`;
    this.saturationSlider.style.setProperty(
      "--slider-track-background",
      saturationGradient,
    );

    // The brightness slider only needs gradient control points at each end.
    let brightnessGradient = "linear-gradient(to right, ";
    brightnessGradient +=
      Blockly.utils.colour.hsvToHex(h, s, 0) +
      ` ${FieldColourHsvSliders.THUMB_RADIUS}px, `;
    brightnessGradient +=
      Blockly.utils.colour.hsvToHex(h, s, 255) +
      ` calc(100% - ${FieldColourHsvSliders.THUMB_RADIUS}px))`;
    this.brightnessSlider.style.setProperty(
      "--slider-track-background",
      brightnessGradient,
    );

    // The RGB sliders only need gradient control points at each end.
    let redGradient = "linear-gradient(to right, ";
    redGradient +=
      Blockly.utils.colour.rgbToHex(0, g, b) +
      ` ${FieldColourHsvSliders.THUMB_RADIUS}px, `;
    redGradient +=
      Blockly.utils.colour.rgbToHex(255, g, b) +
      ` calc(100% - ${FieldColourHsvSliders.THUMB_RADIUS}px))`;
    this.redSlider.style.setProperty("--slider-track-background", redGradient);

    let greenGradient = "linear-gradient(to right, ";
    greenGradient +=
      Blockly.utils.colour.rgbToHex(r, 0, b) +
      ` ${FieldColourHsvSliders.THUMB_RADIUS}px, `;
    greenGradient +=
      Blockly.utils.colour.rgbToHex(r, 255, b) +
      ` calc(100% - ${FieldColourHsvSliders.THUMB_RADIUS}px))`;
    this.greenSlider.style.setProperty(
      "--slider-track-background",
      greenGradient,
    );

    let blueGradient = "linear-gradient(to right, ";
    blueGradient +=
      Blockly.utils.colour.rgbToHex(r, g, 0) +
      ` ${FieldColourHsvSliders.THUMB_RADIUS}px, `;
    blueGradient +=
      Blockly.utils.colour.rgbToHex(r, g, 255) +
      ` calc(100% - ${FieldColourHsvSliders.THUMB_RADIUS}px))`;
    this.blueSlider.style.setProperty(
      "--slider-track-background",
      blueGradient,
    );
  }

  /** Converts RGB (0-255) to HSV (all in [0, 1]). */
  private static rgbToHsv(
    r: number,
    g: number,
    b: number,
  ): { h: number; s: number; v: number } {
    const red = r / 255;
    const green = g / 255;
    const blue = b / 255;
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const v = max;
    if (min === max) return { h: 0, s: 0, v };
    const delta = max - min;
    const s = delta / max;
    let hue: number;
    if (red === max) {
      hue = (green - blue) / delta;
    } else if (green === max) {
      hue = 2 + (blue - red) / delta;
    } else {
      hue = 4 + (red - green) / delta;
    }
    hue /= 6;
    const h = hue - Math.floor(hue);
    return { h, s, v };
  }

  override getAriaValue(): string {
    const hex = this.getValue() ?? "#ffffff";
    const rgb = Blockly.utils.colour.hexToRgb(hex);
    return `${rgb[0]}, ${rgb[1]}, ${rgb[2]}`;
  }

  /**
   * Builds a field from a JSON block definition.
   * @nocollapse
   * @internal
   */
  static override fromJson(options: { colour?: string }): FieldColourHsvSliders {
    // Use `this` so subclasses also construct correctly.
    return new this(options.colour, undefined, options);
  }
}

Blockly.fieldRegistry.register(
  "field_colour_hsv_sliders",
  FieldColourHsvSliders,
);

// Replace the default palette so every colour field opens this editor.
Blockly.fieldRegistry.unregister("field_colour");
Blockly.fieldRegistry.register("field_colour", FieldColourHsvSliders);

// CSS for colour slider fields.
Blockly.Css.register(`
.fieldColourSliderContainer {
  padding: 4px;
  font-family: Roboto, Arial, sans-serif;
  color: #5c5c5c;
  width: 176px;
}
.fieldColourSliderContainer hr {
  border: none;
  border-top: 1px solid #bbb;
}
.fieldColourPreviewRow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.fieldColourPreviewSwatch {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}
.fieldColourHexInput {
  flex: 1;
  min-width: 0;
  border: 1px solid #bbb;
  border-radius: 4px;
  padding: 4px 6px;
  font: inherit;
  color: inherit;
}
.fieldColourHexInputInvalid {
  border-color: #e40000 !important;
  outline-color: #e40000 !important;
}
.fieldColourModeToggle {
  display: flex;
  margin-bottom: 4px;
}
.fieldColourModeTab {
  flex: 1;
  appearance: none;
  border: 1px solid #bbb;
  background: transparent;
  font: inherit;
  color: inherit;
  padding: 3px 0;
  cursor: pointer;
}
.fieldColourModeTab:first-child {
  border-radius: 4px 0 0 4px;
}
.fieldColourModeTab:last-child {
  border-radius: 0 4px 4px 0;
}
.fieldColourModeTab.active {
  background: #5c5c5c;
  color: #fff;
  border-color: #5c5c5c;
}
.fieldColourSliderGroup.hidden {
  display: none;
}
.fieldColourSliderRow {
  margin-bottom: 10px;
}
.fieldColourSliderLabel {
  display: flex;
  justify-content: space-between;
}
.fieldColourEyedropper {
  appearance: none;
  position: relative;
  border: none;
  border-radius: 4px;
  background: transparent;
  font: inherit;
  color: inherit;
  cursor: pointer;
  width: 100%;
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}
.fieldColourEyedropper:hover {
  background: rgba(0, 0, 0, 0.1);
}
.fieldColourEyedropper::before {
  content: "Eyedropper";
}
.fieldColourEyedropper::after {
  content: "";
  margin-left: 8px;
  width: 24px;
  height: 24px;
  background: currentColor;
  pointer-events: none;
  -webkit-mask-image: var(--customize-dial-symbol);
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-image: var(--customize-dial-symbol);
  mask-repeat: no-repeat;
  mask-position: center;
  --customize-dial-symbol: url('data:image/svg+xml,\\
    <svg xmlns="http://www.w3.org/2000/svg" \\
         width="24px" height="24px" \\
         viewBox="0 0 24 24"> \\
      <path stroke="black" strokewidth="1.414" fill="none" \\
            d="m 13 8 L 6 15 Q 3 18 2 21 Q 0 23 .5 23.5 Q 1 24 3 22 \\
                Q 6 21 9 18 L 16 11"/> \\
      <path fill="black" \\
            d="m 12 7 Q 11 6 12 5 Q 13 4 14 5 Q 15 6 16 5 Q 20 -1 22.5 1.5 \\
                Q 25 4 19 8 Q 18 9 19 10 Q 20 11 19 12 Q 18 13 17 12"/> \\
    </svg>');
}
.blocklyKeyboardNavigation .fieldColourEyedropper:focus {
  outline: none;
  border: var(--blockly-selection-width) solid var(--blockly-active-node-color);
  border-radius: 4px;
}
.fieldColourSlider {
  -webkit-appearance: none;
  width: 160px;
  height: 24px;
  margin: 4px 8px 4px 8px;
  padding: 0;
}
.fieldColourSlider:last-child {
  margin-bottom: 4px;
}
.fieldColourSlider:focus {
  outline: none;
}
/* Webkit */
.fieldColourSlider::-webkit-slider-runnable-track {
  background: var(--slider-track-background);
  border-radius: 8px;
  height: 16px;
}
.fieldColourSlider::-webkit-slider-thumb {
  -webkit-appearance: none;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  width: ${FieldColourHsvSliders.THUMB_RADIUS * 2}px;
  height: ${FieldColourHsvSliders.THUMB_RADIUS * 2}px;
  margin-top: -4px;
}
/* Firefox */
.fieldColourSlider::-moz-range-track {
  background: var(--slider-track-background);
  border-radius: 8px;
  height: 16px;
}
.fieldColourSlider::-moz-range-thumb {
  background: #fff;
  border: none;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  width: ${FieldColourHsvSliders.THUMB_RADIUS * 2}px;
  height: ${FieldColourHsvSliders.THUMB_RADIUS * 2}px;
}
.fieldColourSlider::-moz-focus-outer {
  border: 0;
}
/* IE */
.fieldColourSlider::-ms-track {
  background: var(--slider-track-background);
  border-radius: 12px;
  width: 100%;
  height: 24px;
  color: transparent;
}
.fieldColourSlider::-ms-fill-lower {
  background: transparent;
}
.fieldColourSlider::-ms-fill-upper {
  background: transparent;
}
.fieldColourSlider::-ms-thumb {
  background: #fff;
  border: none;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  width: ${FieldColourHsvSliders.THUMB_RADIUS * 2}px;
  height: ${FieldColourHsvSliders.THUMB_RADIUS * 2}px;
}
.blocklyKeyboardNavigation .fieldColourSlider:focus {
  border: var(--blockly-selection-width) solid var(--blockly-active-node-color);
  border-radius: 16px;
  padding: 1px;
}
`);
