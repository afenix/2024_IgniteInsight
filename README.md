# Ignite Insights

### Team
Alister A. Fenix

### Final Proposal
# Persona/Scenario

## Persona
- **Profile**: 32-year-old environmental advocate recently relocated to Arcata, California, concerned about wildfire risk after recent news reports. Passionate about the environment and community safety.
- **Needs**: Assess wildfire risk in her new community, understand the factors contributing to that risk, and identify areas for potential action.
- **Goals**:
  - Quantify changes in wildfire intensity and frequency over time. (Operand: Time)
  - Explore the spatial correlation between wildfire occurrences, population growth, and risk. (Operands: Location, data categories)
- **Expertise**: Tech-savvy, basic environmental knowledge, beginner in GIS.
- **Motivation**: Ensure her home's safety and advocate for informed wildfire mitigation policies within her community.

## Scenario

Elena, alarmed by recent wildfires, discovers Ignite Insights. The splash screen outlines the map's focus on historical wildfire analysis and risk factors. Within the "Wildfires Over Time" section, she uses the time slider to compare wildfire boundaries and a corresponding chart plotting intensity and size. This reveals a concerning increase in fire intensity in recent years. (Insight: Fire intensity is increasing)

She explores how population growth and climate change influence wildfire risk. A time-lapse map illustrates population density changes in fire-prone areas. The "Wildland-Urban Interface" section allows her to compare WUI growth over time, highlighting significant expansion. (Insight: Development encroaches on hazardous zones)

Searching for her Arcata neighborhood, Elena is initially reassured by its moderate risk index. However, examining socio-economic data reveals lower-income neighborhoods within wildfire-prone zones. Concerned about vulnerable populations, she adds the "Endangered Species" layer, noting the proximity of fires to critical habitats. (Insights: Risk is unevenly distributed; wildlife is impacted)

## Key Takeaways

Ignite Insights equips Elena with:

- Data-driven evidence of increasing wildfire intensity in her region.
- Spatial understanding of how population increase and WUI expansion intersect with wildfire risk.
- Awareness of the threat wildfires also pose to various populations (e.g. socioeconomic vulnerability) and endangered species.

# Requirements Document

| Type          | Title                         | Source                    | Operator/Operand     | Description                                                                                           |
|---------------|-------------------------------|---------------------------|----------------------|-------------------------------------------------------------------------------------------------------|
| **Representation (MVP)** | Basemap                     | OpenStreetMap/Mapbox      | N/A                  | Provides geographical context                                                                         |
|               | Historical Wildfires         | USGS/USFS                 | N/A                  | Layer showing wildfire occurrences from 2000-2020, symbolized by time, intensity and area affected.   |
|               | Wildland Urban Interface (WUI) Boundaries | USFS    | N/A                  | Overlay of WUI boundaries over time, highlighting changes in classification and expansion.            |
|               | CONUS WUI Building footprints | USGS                      | N/A                  | Used for zoom in case study examples, highlighting number of structures that are threatened.          |
|               | Wildfire Hazard Potential     | USDA/USFS/Pyrologix       | N/A                  | Overlay with WUI boundaries,                                                                          |
| **Representation (PH2)** | National Risk Index (NRI)    | FEMA                      | N/A                  | Context overlay to highlight communities in the U.S. most at risk for various natural hazards.        |
|               | Endangered Species Habitat   | USFWS                     | N/A                  | Context overlay to show location of endangered species by proximity to wildfires, WUI, population     |
|               | Vulnerable Communities (census tracts) | Esri | N/A                  | Context overlay that will highlight various demographic metrics for assessing vulnerability and risk. |
|               | Climate and Economic Justice | Council on Environmental Quality (CEQ) | N/A   | Context overlay showing various changing climate events (e.g. temperature and drought conditions relevant to wildfire events) and census data. |
| **Interaction (MVP)** | Time Slider                 | Custom tool               | Sequence: Time       | Slider to explore data over time, updating maps according to selected years.                           |
|               | Popups on Click              | JavaScript                | Identify: Event      | Clickable points on wildfires to reveal more details: cause, impact, and preventive measures taken.    |
|               | Swipe                        | Leaflet Plugin            | Compare: Data Layers | Compare historic WUI boundaries with current day to see change over time                               |
| **Interaction (PH2)** | Overlay                     | Leaflet Plugin            | Overlay: Data layers  | Overlay various socio-environmental data layers (see representation) for further refinement of what datasets are of interest to compare and add additional context |
|               | Search Functionality         | Leaflet Plugin            | Search: Data         | Enables users to search areas on the map to zoom in to various regions to examine data points further  |

# Lo-fi Wireframes (MVP)

**Splash Screen**:
- Title: Ignite Insights
- Brief description: "Explore Historical Wildfire Data & Risk Factors"
- Button: "Enter"

**Wildfires Over Time**:
- Side-by-side view:
  - Map (Right): Shows historical wildfire boundaries in California.
  - Chart (Left): Plots wildfire intensity and size over time, with interactive points corresponding to specific fires on the map (hover interaction).
- Time slider: Allows Elena to explore changes in wildfire intensity and frequency over time (filter: time).

**Population Growth & Climate Change**:
- Map with time-lapse functionality: Shows population density changes in fire-prone areas over time (filter: time).
- Text overlay: Explains how population growth and climate change can exacerbate wildfire risk.

**Wildland-Urban Interface**:
- Map with swipe functionality: Allows Elena to compare WUI boundaries across different years (filter: year).
- Legend: Explains the WUI designation.

# Lo-fi Wireframes (PH2 if time allows)

**Community Risk Assessment**:
- Map centered on Arcata, California.
- Layers:
  - Basemap
  - Wildfire risk index (choropleth symbolization) - Initially shows "Relatively Moderate" risk for Humboldt County.
  - Socioeconomic data (choropleth symbolization)
  - Historic wildfire boundaries (polygon overlay)
  - Endangered species habitat data (polygon overlay)
- Interactive elements:
  - Click on a specific area (tract) to view a pop-up summarizing various risks to that community.
  - Resymbolize button: Allows Elena to choose which data layer to visualize primarily (e.g., wildfire risk, socioeconomic factors).
  - Layer control panel: Provides a more granular way to turn data layers on and off.






