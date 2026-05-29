"use client";

import {
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";

export interface PreviewHandle {
  run: () => void;
}

interface PreviewProps {
  code: string;
  onStatusChange: (status: string, color: string) => void;
}

type LibraryKind = "g2" | "g6" | "x6";

interface LibrarySpec {
  kind: LibraryKind;
  pkg: string; // npm package name used in import statements
  globalName: "G2" | "G6" | "X6";
  defaultExports: string[]; // names always destructured even if not explicitly imported
}

const LIBRARY_SPECS: LibrarySpec[] = [
  // 注意：X6 必须在 G6 之前匹配，因为两者都包含 `new Graph(`，
  // 必须用 `@antv/x6` import 关键字优先识别。
  { kind: "x6", pkg: "@antv/x6", globalName: "X6", defaultExports: ["Graph"] },
  { kind: "g6", pkg: "@antv/g6", globalName: "G6", defaultExports: ["Graph"] },
  { kind: "g2", pkg: "@antv/g2", globalName: "G2", defaultExports: ["Chart"] },
];

/**
 * 根据代码内容判定库类型。
 * 优先按 import 语句中的包名识别（最可靠）；
 * 若都没有，再降级用 `new Graph(` / `new Chart(` 猜测。
 */
function detectLibrary(code: string): LibrarySpec {
  for (const spec of LIBRARY_SPECS) {
    if (code.includes(spec.pkg)) return spec;
  }
  // 兜底：没有 import 的情况下，按入口类名猜
  if (/new\s+Graph\s*\(/.test(code)) {
    // Graph 在 X6 和 G6 都用，默认 G6（向后兼容旧行为）
    return LIBRARY_SPECS.find((s) => s.kind === "g6")!;
  }
  return LIBRARY_SPECS.find((s) => s.kind === "g2")!;
}

/** 销毁旧实例，X6 用 dispose、G2/G6 用 destroy。 */
function disposeInstance(instance: unknown): void {
  if (!instance || typeof instance !== "object") return;
  const inst = instance as { dispose?: () => void; destroy?: () => void };
  try {
    if (typeof inst.dispose === "function") inst.dispose();
    else if (typeof inst.destroy === "function") inst.destroy();
  } catch (err) {
    console.warn("[Preview] dispose previous instance failed:", err);
  }
}

const Preview = forwardRef<PreviewHandle, PreviewProps>(function Preview(
  { code, onStatusChange },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<unknown>(null);

  const execCode = useCallback(
    (container: HTMLDivElement) => {
      const spec = detectLibrary(code);
      const globalLib = (window as unknown as Record<string, unknown>)[
        spec.globalName
      ];

      if (!globalLib) {
        throw new Error(`${spec.globalName} 库尚未加载，请稍后重试`);
      }

      // 提取该包所有 named imports（处理多行、别名、`type X`）
      const extractNames = (src: string, pkg: string): string[] => {
        const names: string[] = [];
        // 注意：转义包名中的 `/`
        const escaped = pkg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(
          `import\\s+(?:type\\s+)?\\{([^}]*)\\}\\s*from\\s*['"]${escaped}['"];?`,
          "gs",
        );
        for (const m of src.matchAll(re)) {
          m[1].split(",").forEach((token) => {
            const cleaned = token.trim().replace(/^type\s+/, "");
            const name = cleaned
              .split(/\s+as\s+/)
              .pop()
              ?.trim();
            if (name) names.push(name);
          });
        }
        return names;
      };

      const namedImports = extractNames(code, spec.pkg);
      const destructure = [
        ...new Set([...spec.defaultExports, ...namedImports]),
      ].join(", ");

      // 移除三家库的 import 语句（避免在 new Function 中报语法错误）
      let stripped = code;
      for (const s of LIBRARY_SPECS) {
        const escaped = s.pkg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        stripped = stripped
          .replace(
            new RegExp(
              `import\\s*\\{[^}]*\\}\\s*from\\s*['"]${escaped}['"];?`,
              "g",
            ),
            "",
          )
          .replace(
            new RegExp(`import\\s+\\w+\\s+from\\s*['"]${escaped}['"];?`, "g"),
            "",
          )
          .replace(
            new RegExp(
              `import\\s*\\*\\s*as\\s+\\w+\\s*from\\s*['"]${escaped}['"];?`,
              "g",
            ),
            "",
          );
      }

      // 将 `container: 'container'` 字面量替换为运行时注入的变量
      stripped = stripped.replace(
        /container:\s*['"]container['"]/g,
        "container: container",
      );

      const exec = `const { ${destructure} } = window.${spec.globalName};\n${stripped}`;
      const fn = new Function("container", exec);
      const result = fn(container);

      // X6 / G6 的 new Graph() 不一定会以返回值形式暴露实例，
      // 但若用户代码 `return graph;` 我们也能拿到；否则保留为 null。
      if (result && typeof result === "object") {
        instanceRef.current = result;
      }
    },
    [code],
  );

  const runCode = useCallback(() => {
    if (!code.trim() || !containerRef.current) return;

    disposeInstance(instanceRef.current);
    instanceRef.current = null;

    const container = containerRef.current;
    container.innerHTML = "";

    try {
      execCode(container);
      onStatusChange("预览已更新", "var(--green)");
    } catch (e) {
      console.error(e);
      const error = e as Error;
      container.innerHTML = `<div class="error-block"><strong>运行错误</strong><br>${error.message}</div>`;
      onStatusChange("运行错误", "var(--red)");
    }
  }, [code, execCode, onStatusChange]);

  useImperativeHandle(ref, () => ({ run: runCode }), [runCode]);

  // 自动运行（带去抖）；轮询等待 CDN 库就绪
  useEffect(() => {
    if (!code.trim()) return;

    let pollTimer: ReturnType<typeof setTimeout>;
    const debounceTimer = setTimeout(() => {
      const spec = detectLibrary(code);
      const check = () => {
        const ready = !!(window as unknown as Record<string, unknown>)[
          spec.globalName
        ];
        if (ready) {
          runCode();
        } else {
          pollTimer = setTimeout(check, 200);
        }
      };
      check();
    }, 800);

    return () => {
      clearTimeout(debounceTimer);
      clearTimeout(pollTimer!);
    };
  }, [code, runCode]);

  return (
    <div className="preview-panel">
      <div className="panel-header">
        <span className="panel-header-label">预览</span>
      </div>
      <div className="preview-container">
        {!code.trim() && (
          <div className="preview-placeholder">
            <div className="preview-placeholder-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <p>运行代码后在此预览</p>
            <small>点击「运行」或修改代码自动触发</small>
          </div>
        )}
        <div
          ref={containerRef}
          id="container"
          style={{
            display: code.trim() ? "block" : "none",
            width: "100%",
            minHeight: "400px",
          }}
        />
      </div>
    </div>
  );
});

export default Preview;
