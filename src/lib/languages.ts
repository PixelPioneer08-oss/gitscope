// A subset of GitHub's linguist colors, adjusted where the original vanishes on dark backgrounds.
const LANG_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', Go: '#00ADD8', Rust: '#dea584',
  C: '#8a8a8a', 'C++': '#f34b7d', Java: '#b07219', Ruby: '#a0323a', Shell: '#89e051', HTML: '#e34c26',
  CSS: '#7b4bc4', Vue: '#41b883', PHP: '#4F5D95', Swift: '#F05138', Kotlin: '#A97BFF', 'C#': '#178600',
  'Jupyter Notebook': '#DA5B0B', Dart: '#00B4AB', Lua: '#4f4fd0', Elixir: '#8a5ea0', Haskell: '#5e5086',
  Scala: '#c22d40', 'Objective-C': '#438eff', Makefile: '#427819', Dockerfile: '#5b7f8c', Nix: '#7e7eff',
  Zig: '#ec915c', Svelte: '#ff3e00', Assembly: '#8a6a3a', Perl: '#0298c3', R: '#198CE7', Clojure: '#db5855',
  'Vim Script': '#199f4b', 'Emacs Lisp': '#c065db', TeX: '#4f7d2a', MDX: '#fcb32c', SCSS: '#c6538c',
  Astro: '#ff5a03', OCaml: '#ef7a08', Julia: '#a270ba', Erlang: '#B83998', Groovy: '#4298b8',
  PowerShell: '#2f6fb0', Solidity: '#AA6746', HCL: '#844FBA', MATLAB: '#e16737', Starlark: '#76d275',
}

export function langColor(lang: string | null | undefined) {
  if (!lang) return 'hsl(240 4% 60%)'
  if (LANG_COLORS[lang]) return LANG_COLORS[lang]
  let h = 0
  for (const c of lang) h = (h * 31 + c.charCodeAt(0)) % 360
  return `hsl(${h} 55% 55%)`
}
