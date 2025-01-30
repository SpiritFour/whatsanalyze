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
        default = pkgs.mkShell {
          nativeBuildInputs = [
            pkgs.nodejs_22
            pkgs.pnpm
            pkgs.firebase-tools
            pkgs.python39
            pkgs.git
          ];
          shellHook = ''
              mkdir -p .out
              ln -s  ${pkgs.nodejs_22.out}/bin/node .out/node
              ln -s  ${pkgs.pkgs.pnpm.out}/bin/pnpm .out/pnpm

          '';
        };

      });
    };
}
