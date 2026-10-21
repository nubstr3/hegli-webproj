export type WidgetConfig = Record<string, unknown>

/** Props every widget may receive from the dashboard (widgets that need no settings can ignore them). */
export type WidgetProps = {
  config: WidgetConfig
  onConfigChange: (config: WidgetConfig) => void
}