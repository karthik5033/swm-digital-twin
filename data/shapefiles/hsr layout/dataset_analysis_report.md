# Dataset Analysis Report
This report contains an analysis of the spatial datasets in the BBMP shapefiles.

## Dataset: BBMP_BIO-Methanisation.shp
**Number of Features**: 11
**Coordinate Reference System (CRS)**: EPSG:4326
**Bounding Box**: [77.54072778 12.87292222 77.65071111 13.08477222]

### Columns
- `OID_` (int64)
- `Name` (object)
- `FolderPath` (object)
- `SymbolID` (int64)
- `AltMode` (int32)
- `Base` (float64)
- `Snippet` (object)
- `PopupInfo` (object)
- `HasLabel` (int32)
- `LabelID` (int64)
- `geometry` (geometry)

### Sample Data (First 3 rows)
|    |   OID_ | Name      | FolderPath                      |   SymbolID |   AltMode |   Base | Snippet   | PopupInfo   |   HasLabel |   LabelID |
|---:|-------:|:----------|:--------------------------------|-----------:|----------:|-------:|:----------|:------------|-----------:|----------:|
|  0 |      0 | Placemark | Document/bio_mithanization_unit |          0 |        -1 |      0 |           |             |         -1 |         0 |
|  1 |      0 | Placemark | Document/bio_mithanization_unit |          0 |        -1 |      0 |           |             |         -1 |         0 |
|  2 |      0 | Placemark | Document/bio_mithanization_unit |          0 |        -1 |      0 |           |             |         -1 |         0 |

### Summary Statistics
|       |   OID_ |   SymbolID |   AltMode |   Base |   HasLabel |   LabelID |
|:------|-------:|-----------:|----------:|-------:|-----------:|----------:|
| count |     11 |         11 |        11 |     11 |         11 |        11 |
| mean  |      0 |          0 |        -1 |      0 |         -1 |         0 |
| std   |      0 |          0 |         0 |      0 |          0 |         0 |
| min   |      0 |          0 |        -1 |      0 |         -1 |         0 |
| 25%   |      0 |          0 |        -1 |      0 |         -1 |         0 |
| 50%   |      0 |          0 |        -1 |      0 |         -1 |         0 |
| 75%   |      0 |          0 |        -1 |      0 |         -1 |         0 |
| max   |      0 |          0 |        -1 |      0 |         -1 |         0 |

## Dataset: BBMP_Dry_Waste_Collection_Centres.shp
**Number of Features**: 336
**Coordinate Reference System (CRS)**: EPSG:4326
**Bounding Box**: [77.4763769 12.8546225 77.761751  13.11799  ]

### Columns
- `OID_` (int64)
- `Name` (object)
- `FolderPath` (object)
- `SymbolID` (int64)
- `AltMode` (int32)
- `Base` (float64)
- `Snippet` (object)
- `PopupInfo` (object)
- `HasLabel` (int32)
- `LabelID` (int64)
- `geometry` (geometry)

### Sample Data (First 3 rows)
|    |   OID_ | Name      | FolderPath                        |   SymbolID |   AltMode |   Base | Snippet   | PopupInfo   |   HasLabel |   LabelID |
|---:|-------:|:----------|:----------------------------------|-----------:|----------:|-------:|:----------|:------------|-----------:|----------:|
|  0 |      0 | Placemark | BBMP dry waste collection centres |          0 |        -1 |      0 |           |             |         -1 |         0 |
|  1 |      0 | Placemark | BBMP dry waste collection centres |          0 |        -1 |      0 |           |             |         -1 |         0 |
|  2 |      0 | Placemark | BBMP dry waste collection centres |          0 |        -1 |      0 |           |             |         -1 |         0 |

### Summary Statistics
|       |   OID_ |   SymbolID |   AltMode |   Base |   HasLabel |   LabelID |
|:------|-------:|-----------:|----------:|-------:|-----------:|----------:|
| count |    336 |        336 |       336 |    336 |        336 |       336 |
| mean  |      0 |          0 |        -1 |      0 |         -1 |         0 |
| std   |      0 |          0 |         0 |      0 |          0 |         0 |
| min   |      0 |          0 |        -1 |      0 |         -1 |         0 |
| 25%   |      0 |          0 |        -1 |      0 |         -1 |         0 |
| 50%   |      0 |          0 |        -1 |      0 |         -1 |         0 |
| 75%   |      0 |          0 |        -1 |      0 |         -1 |         0 |
| max   |      0 |          0 |        -1 |      0 |         -1 |         0 |

## Dataset: BBMP_Dumpyards.shp
**Number of Features**: 3
**Coordinate Reference System (CRS)**: EPSG:4326
**Bounding Box**: [77.6459222 13.1035833 77.6688778 13.1539417]

### Columns
- `geometry` (geometry)

### Sample Data (First 3 rows)
|--:|
| 0 |
| 1 |
| 2 |

### Summary Statistics
**Error reading shapefile**: Cannot describe a DataFrame without columns

## Dataset: BBMP_Waste_Processing_Units.shp
**Number of Features**: 8
**Coordinate Reference System (CRS)**: EPSG:4326
**Bounding Box**: [77.430853 12.857962 77.686032 13.122286]

### Columns
- `OID_` (int64)
- `Name` (object)
- `FolderPath` (object)
- `SymbolID` (int64)
- `AltMode` (int32)
- `Base` (float64)
- `Snippet` (object)
- `PopupInfo` (object)
- `HasLabel` (int32)
- `LabelID` (int64)
- `geometry` (geometry)

### Sample Data (First 3 rows)
|    |   OID_ | Name      | FolderPath                  |   SymbolID |   AltMode |   Base | Snippet   | PopupInfo   |   HasLabel |   LabelID |
|---:|-------:|:----------|:----------------------------|-----------:|----------:|-------:|:----------|:------------|-----------:|----------:|
|  0 |      0 | Placemark | BBMP waste processing units |          0 |        -1 |      0 |           |             |         -1 |         0 |
|  1 |      0 | Placemark | BBMP waste processing units |          0 |        -1 |      0 |           |             |         -1 |         0 |
|  2 |      0 | Placemark | BBMP waste processing units |          0 |        -1 |      0 |           |             |         -1 |         0 |

### Summary Statistics
|       |   OID_ |   SymbolID |   AltMode |   Base |   HasLabel |   LabelID |
|:------|-------:|-----------:|----------:|-------:|-----------:|----------:|
| count |      8 |          8 |         8 |      8 |          8 |         8 |
| mean  |      0 |          0 |        -1 |      0 |         -1 |         0 |
| std   |      0 |          0 |         0 |      0 |          0 |         0 |
| min   |      0 |          0 |        -1 |      0 |         -1 |         0 |
| 25%   |      0 |          0 |        -1 |      0 |         -1 |         0 |
| 50%   |      0 |          0 |        -1 |      0 |         -1 |         0 |
| 75%   |      0 |          0 |        -1 |      0 |         -1 |         0 |
| max   |      0 |          0 |        -1 |      0 |         -1 |         0 |