{
  inputs = {
     nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };
  outputs =
    { systems, nixpkgs, ... }@inputs:
    let
      eachSystem = f: nixpkgs.lib.genAttrs (import systems) (system: f nixpkgs.legacyPackages.${system});
    in
    {
      devShells = eachSystem (pkgs: {
        default = let
          pnpm = pkgs.writeShellScriptBin "pnpm" ''
            exec ${pkgs.nodejs_22}/bin/corepack pnpm@8.15.8 "$@"
          '';
        in pkgs.mkShell {
          nativeBuildInputs = [
            pkgs.nodejs_22
            pnpm
            pkgs.firebase-tools
            pkgs.python311
            pkgs.git
          ];
        };

      });
    };
}
