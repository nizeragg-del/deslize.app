type LogoProps = {
  className?: string
  markOnly?: boolean
  size?: number
  width?: number
}

export function Logo({ className = "", markOnly = false, size = 32, width = 132 }: LogoProps) {
  const renderedWidth = markOnly ? size : width
  const renderedHeight = markOnly ? size : Math.round(width * (420 / 1076))

  return (
    <span
      className={`brand-logo ${markOnly ? "brand-logo-mark-only" : ""} ${className}`.trim()}
      style={{
        display: "inline-flex",
        width: renderedWidth,
        height: renderedHeight,
        alignItems: "center",
        overflow: "visible",
      }}
    >
      <img
        src={markOnly ? "/deslize-mark.png" : "/deslize-logo-horizontal.png"}
        alt={markOnly ? "Deslize" : "deslize"}
        width={markOnly ? 512 : 1076}
        height={markOnly ? 512 : 420}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </span>
  )
}
