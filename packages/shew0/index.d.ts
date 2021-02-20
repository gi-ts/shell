/**
 * Shew 0
 *
 * Generated from 0.0
 */

import * as Gdk from "@gi-types/gdk";
import * as Gtk from "@gi-types/gtk";
import * as GObject from "@gi-types/gobject";
import * as Gio from "@gi-types/gio";

export module ExternalWindow {
    export interface ConstructorProperties extends GObject.Object.ConstructorProperties {
        [key: string]: any;
        display: Gdk.Display;
    }
}
export class ExternalWindow extends GObject.Object {
    static $gtype: GObject.GType<ExternalWindow>;

    constructor(properties?: Partial<ExternalWindow.ConstructorProperties>, ...args: any[]);
    _init(properties?: Partial<ExternalWindow.ConstructorProperties>, ...args: any[]): void;

    // Properties
    display: Gdk.Display;

    // Constructors

    static new_from_handle(handle_str: string): ExternalWindow;

    // Members

    get_display(): Gdk.Display;
    set_parent_of(child_window: Gdk.Window): void;
    vfunc_set_parent_of(child_window: Gdk.Window): void;
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
    _init(properties?: Partial<WindowExporter.ConstructorProperties>, ...args: any[]): void;

    // Properties
    window: Gtk.Window;

    // Constructors

    static ["new"](window: Gtk.Window): WindowExporter;

    // Members

    ["export"](): Promise<string>;
    ["export"](callback: Gio.AsyncReadyCallback<this> | null): void;
    ["export"](callback?: Gio.AsyncReadyCallback<this> | null): Promise<string> | void;
    export_finish(result: Gio.AsyncResult): string;
    unexport(): void;
}
