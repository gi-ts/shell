/**
 * Shew 0
 *
 * Generated from 0.0
 */

import * as GObject from "@gi-types/gobject2";
import * as Gdk from "@gi-types/gdk4";
import * as Gtk from "@gi-types/gtk4";
import * as Gio from "@gi-types/gio2";

export module ExternalWindow {
    export interface ConstructorProperties extends GObject.Object.ConstructorProperties {
        [key: string]: any;
        display: Gdk.Display;
    }
}
export class ExternalWindow extends GObject.Object {
    static $gtype: GObject.GType<ExternalWindow>;

    constructor(properties?: Partial<ExternalWindow.ConstructorProperties>, ...args: any[]);
    _init(...args: any[]): void;

    // Properties
    get display(): Gdk.Display;

    // Constructors

    static new_from_handle(handle_str: string): ExternalWindow;

    // Members

    get_display(): Gdk.Display;
    set_parent_of(child_surface: Gdk.Surface): void;
    vfunc_set_parent_of(child_surface: Gdk.Surface): void;
}
export module WindowExporter {
    export interface ConstructorProperties extends GObject.Object.ConstructorProperties {
        [key: string]: any;
        window: Gtk.Window;
    }
}
export class WindowExporter extends GObject.Object {
    static $gtype: GObject.GType<WindowExporter>;

    constructor(properties?: Partial<WindowExporter.ConstructorProperties>, ...args: any[]);
    _init(...args: any[]): void;

    // Properties
    get window(): Gtk.Window;

    // Constructors

    static ["new"](window: Gtk.Window): WindowExporter;

    // Members

    ["export"](): Promise<string>;
    ["export"](callback: Gio.AsyncReadyCallback<this> | null): void;
    ["export"](callback?: Gio.AsyncReadyCallback<this> | null): Promise<string> | void;
    export_finish(result: Gio.AsyncResult): string;
    unexport(): void;
}
