import { useState } from "react";
import "./Tabs.css";

/**
 * Pestañas genéricas — no específicas de ninguna pantalla.
 *
 * tabs: [{ id, label, content, hidden }]. `hidden: true` saca la pestaña
 * tanto de la lista como del panel (no solo la deshabilita) — para el caso
 * de una pestaña condicional, como "Historial" en EquipoInfo, que no debe
 * existir en absoluto para el equipo propio, no solo estar oculta a medias.
 *
 * Si la pestaña activa deja de estar visible (cambia `hidden` entre
 * renders), cae a la primera pestaña visible en vez de quedar en un estado
 * inválido sin panel para mostrar.
 */
export default function Tabs({ tabs, defaultTab, className = "" }) {
  const visibleTabs = tabs.filter((tab) => !tab.hidden);
  const [activeId, setActiveId] = useState(defaultTab ?? visibleTabs[0]?.id);

  const active = visibleTabs.find((tab) => tab.id === activeId) ?? visibleTabs[0];

  return (
    <div className={`ui-tabs ${className}`.trim()}>
      <div className="ui-tabs-list" role="tablist">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active?.id === tab.id}
            className={`ui-tabs-tab${active?.id === tab.id ? " active" : ""}`}
            onClick={() => setActiveId(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="ui-tabs-panel" role="tabpanel">
        {active?.content}
      </div>
    </div>
  );
}
