export type WidgetConfig = Record<string, unknown>

/** Props every widget may receive from the dashboard (widgets that need no settings can ignore them). */
export type WidgetProps = {
  config: WidgetConfig
  onConfigChange: (config: WidgetConfig) => void
  /** Settings of every widget on the dashboard, keyed by widget type (lets one widget read another's). */
  siblings: Record<string, WidgetConfig>
}