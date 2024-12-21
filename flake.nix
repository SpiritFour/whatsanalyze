{
  inputs = {
     nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
#    systems.url = "github:nix-systems/default";
  };
#  nativeBuildInputs = [ installShellFiles ];

  outputs =
    { systems, nixpkgs, ... }@inputs:
    let
      eachSystem = f: nixpkgs.lib.genAttrs (import systems) (system: f nixpkgs.legacyPackages.${system});
    in
    {
      devShells = eachSystem (pkgs: {
        default = pkgs.mkShell {
          nativeBuildInputs = [
            pkgs.nodejs_18
            pkgs.pnpm
            pkgs.firebase-tools
            pkgs.python39
            pkgs.git
          ];
        };

      });
    };
}
