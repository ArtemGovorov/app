// 🚀 Launch.js - Build mode

// Types
export enum Mode {
  Development,
  Production,
}

// Determine the default build mode, based on `process.env.NODE_ENV`
function getDefaultMode(): Mode {
  return process.env.NODE_ENV === "production"
    ? Mode.Production : Mode.Development;
}

export default class CurrentMode {

  // --------------------------------------------------------------------------
  /* PROPERTIES */
  // --------------------------------------------------------------------------

  // Default mode = development
  private _mode: Mode = getDefaultMode();

  // --------------------------------------------------------------------------
  /* METHODS */
  // --------------------------------------------------------------------------

  // Get the current build mode
  public get(): Mode {
    return this._mode;
  }

  // Set a new build mode
  public set(mode: Mode): void {
    this._mode = mode;
  }

  // Test if the current mode matches the input
  public is(mode: Mode): boolean {
    return this._mode === mode;
  }

  // To string
  public toString() {
    return this._mode === Mode.Production ? "production" : "development";
  }
}
