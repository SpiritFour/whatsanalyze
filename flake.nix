{
  inputs = {
     nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
#    systems.url = "github:nix-systems/default";
  };

  outputs =
    { systems, nixpkgs, ... }@inputs:
    let
      eachSystem = f: nixpkgs.lib.genAttrs (import systems) (system: f nixpkgs.legacyPackages.${system});
    in
    {
      devShells = eachSystem (pkgs: {
        default = pkgs.mkShellNoCC {
          buildInputs = [
            pkgs.nodejs_18
            pkgs.pnpm
            pkgs.firebase-tools
          ];
        };
      });
    };
}
