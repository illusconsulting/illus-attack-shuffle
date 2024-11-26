# **Attack Shuffle**

## **Overview**

Attack Shuffle is an internal tool developed by Illus Consulting to make measuring, maximizing, and maturing threat-informed defense more accessible to organizations of all sizes. The application is designed to support consulting engagements by enabling the creation, management, and analysis of models that depict relationships between environments, asset types, attack techniques, controls, and security functions.

Leveraging data-driven methodologies and threat-informed frameworks, the application helps streamline and enhance consulting deliverables while maintaining control and security of the underlying data and architecture. By using ArangoDB and a suite of microservices, Attack Shuffle allows consultants to:

Understand and analyze their threat landscapes.
Model and measure defenses against adversary techniques.
Explore opportunities for maximizing security investments and operational maturity.

---

## **File and Folder Structure**

The project is organized as follows:
```
attack-shuffle/
├── docker-compose.yml
├── arangodb/
│   ├── init/
│   │   ├── init-database.js      # Initializes the database
│   │   ├── create-collections.js # Creates required collections
│   │   ├── create-views.js       # Creates ArangoSearch views
│   │   └── create-graphs.js      # Creates graphs
│   └── data/                     # Directory for persisted database storage
├── services/
│   ├── model-lifecycle/
│   │   ├── index.js              # Main entry point for model lifecycle service
│   │   ├── manifest.json         # Metadata for the service
│   │   └── utils/
│   │       └── lifecycle-utils.js # Utility functions for model lifecycle
│   ├── entity-management/
│   │   ├── index.js
│   │   ├── manifest.json
│   │   └── utils/
│   │       └── entity-utils.js
│   ├── search-and-query/
│   │   ├── index.js
│   │   ├── manifest.json
│   │   └── utils/
│   │       └── search-utils.js
│   ├── backup-and-restore/
│   │   ├── index.js
│   │   ├── manifest.json
│   │   └── utils/
│   │       └── backup-utils.js
│   └── security-and-access/
│       ├── index.js
│       ├── manifest.json
│       └── utils/
│           └── access-utils.js
├── scripts/
│   ├── deploy-foxx-services.sh
│   ├── initialize-arangodb.sh
│   └── backup-models.sh
├── config/
│   ├── arango.env                # Environment variables for ArangoDB
│   ├── foxx.env                  # Environment variables for Foxx services
│   └── backup-config.json        # Configuration for backup/restore
├── logs/
│   └── .gitkeep                  # Placeholder to ensure the directory exists
└── README.md
```

---

## **Architecture**

### **Context Diagram**

```mermaid
C4Context
  title Attack Shuffle Context Diagram

  Boundary(Client, "Client System") {
    Person(ClientUser, "Consulting User", "Internal consultant using the application for model creation and analysis.")
  }

  Boundary(InternalSystem, "Internal System") {
    System(AttackShuffle, "Attack Shuffle Application", "Provides APIs and microservices for model management.")
    System_Ext(ArangoDB, "ArangoDB Server", "Database for managing models, documents, edges, and reporting.")
  }

  Rel(ClientUser, AttackShuffle, "Uses APIs to manage and query models")
  Rel(AttackShuffle, ArangoDB, "Stores and retrieves data")
```

---

### **C4 Container Diagram**

```mermaid
C4Container
    title Container diagram for Attack Shuffle

    Boundary(illusConsulting, "Illus Consulting") {
        Person(ClientUser, "Consulting User", "Uses the application to create and manage models for consulting engagements.")
    }

    Boundary(AttackShuffle, "Attack Shuffle Application") {
        Container(API, "Attack Shuffle API", "Node.js", "Central API that connects the client to the application's microservices.")
        Container(BackupService, "Backup & Restore Service", "Node.js", "Handles model backups and restoration using ArangoDB's tools.")
        Container(ModelService, "Model Lifecycle Service", "Node.js", "Manages model creation, updates, and versioning.")
        Container(EntityService, "Entity Management Service", "Node.js", "Handles documents and edges for models.")
        Container(QueryService, "Search & Query Service", "Node.js", "Manages search and filtering using ArangoSearch Views.")
        Container(SecurityService, "Security & Access Service", "Node.js", "Implements authentication and access control.")
    }

    System_Ext(ArangoDB, "ArangoDB Server", "Database", "Stores data for models, documents, edges, and views.")

    Rel(ClientUser, API, "Interacts with the API for model and data management")
    Rel(API, BackupService, "Uses backup and restore capabilities")
    Rel(API, ModelService, "Delegates model lifecycle tasks")
    Rel(API, EntityService, "Delegates entity management tasks")
    Rel(API, QueryService, "Handles search and query requests")
    Rel(API, SecurityService, "Ensures secure access")
    Rel(BackupService, ArangoDB, "Performs backups and restores")
    Rel(ModelService, ArangoDB, "Creates and manages collections, views, and graphs")
    Rel(EntityService, ArangoDB, "Manages documents and edges")
    Rel(QueryService, ArangoDB, "Executes queries and uses ArangoSearch Views")
    Rel(SecurityService, ArangoDB, "Enforces access control policies")
```

### **C4 Component Diagram**

```mermaid
C4Component
    title Component diagram for Attack Shuffle

    Container_Boundary(AttackShuffleAPI, "Attack Shuffle API") {
        Component(Controller, "API Controller", "Node.js", "Handles API requests and routes them to appropriate services.")
        Component(ModelService, "Model Lifecycle Service", "Node.js", "Manages creation, updates, and lifecycle of models.")
        Component(EntityService, "Entity Management Service", "Node.js", "Manages documents and edges related to models.")
        Component(QueryService, "Search & Query Service", "Node.js", "Performs searches and queries using ArangoSearch Views.")
        Component(BackupService, "Backup & Restore Service", "Node.js", "Handles backups and restores of model data.")
        Component(SecurityService, "Security & Access Service", "Node.js", "Manages authentication and access control.")
    }

    Container_Ext(ArangoDB, "ArangoDB Server", "Database", "Stores data for models, documents, edges, and search views.")

    Rel(Controller, ModelService, "Forwards model lifecycle operations")
    Rel(Controller, EntityService, "Delegates document and edge management")
    Rel(Controller, QueryService, "Forwards search and query requests")
    Rel(Controller, BackupService, "Delegates backup and restore operations")
    Rel(Controller, SecurityService, "Manages secure access")
    Rel(ModelService, ArangoDB, "Creates and manages collections, graphs, and views")
    Rel(EntityService, ArangoDB, "Manages documents and edges")
    Rel(QueryService, ArangoDB, "Executes queries and uses ArangoSearch Views")
    Rel(BackupService, ArangoDB, "Performs backup and restore operations")
    Rel(SecurityService, ArangoDB, "Enforces access control")

```

---

## **Sequence Diagrams**

### **Model Creation**

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant ModelService
    participant ArangoDB

    Client->>API: Request to create model
    API->>ModelService: Forward model creation request
    ModelService->>ArangoDB: Create collections, views, and graphs
    ArangoDB-->>ModelService: Confirmation
    ModelService-->>API: Model created
    API-->>Client: Model creation confirmation
```

### **Backup a Model**

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant BackupService
    participant ArangoDB

    Client->>API: Request to backup model
    API->>BackupService: Trigger backup
    BackupService->>ArangoDB: Perform arangodump
    ArangoDB-->>BackupService: Dump completed
    BackupService-->>API: Backup confirmation
    API-->>Client: Backup completed
```

---

## **Licensing**

This project is **dual-licensed** under the following terms:

### **1. GNU General Public License v3.0 (GPLv3)**

- Applies to all scripts and code specific to this project, including:
  - `services/`
  - `scripts/`
- The GPLv3 allows you to:
  - Use, modify, and redistribute the code under the same license.
  - Ensure freedom for other users to do the same.
- Full license text: [GPLv3](https://choosealicense.com/licenses/gpl-3.0/)

### **2. ArangoDB Community License**

- Applies to the **ArangoDB Community Edition** used in this project.
- The ArangoDB Community License:
  - Permits internal use of ArangoDB for applications such as this.
  - Restricts redistributing ArangoDB Community Edition as part of a product or service.
  - Full license text: [Community License](https://arangodb.com/wp-content/uploads/2024/05/ADB-Community-License_31OCT2023.pdf)

---

## **Acknowledgments**

- **ArangoDB Community Edition** is the core database powering this application. Learn more at [ArangoDB](https://arangodb.com).
- This project respects the terms of all dependencies and ensures compliance with the applicable licenses.

This project builds on the incredible work of organizations and individuals committed to advancing threat-informed defense and cybersecurity maturity. We gratefully acknowledge the following:

### **Threat-Informed Frameworks**

- [MITRE ATT&CK](https://attack.mitre.org/) – The industry standard for adversary tactics and techniques.
- [MITRE Engenuity Center for Threat-Informed Defense (CTID)](https://mitre-engenuity.org/cybersecurity/center-for-threat-informed-defense/) – Advancing collaborative research in cybersecurity.
- [CTID ATT&CK Mappings Explorer](https://mitre-engenuity.org/cybersecurity/center-for-threat-informed-defense/our-work/mappings-explorer/) – A tool for exploring ATT&CK mappings.
- [CTID Top ATT&CK Techniques](https://top-attack-techniques.mitre-engenuity.org/#/) – Highlights the most commonly used ATT&CK techniques.
- [CTID Measure, Maximize, and Mature Threat-Informed Defense (M3TID)](https://center-for-threat-informed-defense.github.io/m3tid/) – A framework to improve threat-informed defense maturity.
- [CTID ATT&CK Flow](https://center-for-threat-informed-defense.github.io/attack-flow/) – A model for visualizing adversary behaviors and attack scenarios.

### **Cybersecurity Maturity Models**

- [Center for Internet Security (CIS) Community Defense Model (CDM)](https://www.cisecurity.org/insights/white-papers/cis-community-defense-model-2-0) – Maps defensive measures to common cyber threats.
- [Sounil Yu’s Cyber Defense Matrix](https://cyberdefensematrix.com/) – A framework for organizing and evaluating cybersecurity capabilities.

### **Community Contributions**

- [Matt Adams’ STRIDE GPT](https://github.com/mrwadams/stride-gpt) – A tool for automating STRIDE threat modeling.
- [Matt Adams’ AttackGen](https://github.com/mrwadams/attackgen) – A generator for simulated attack scenarios.

### **Thought Leadership**

- [Douglas Hubbard & Richard Seiersen’s *How to Measure Anything in Cybersecurity Risk*](https://www.howtomeasureanything.com/cybersecurity/) – Foundational concepts for quantifying and improving cybersecurity risk management.

These resources have inspired and informed the development of **Attack Shuffle**, making it a valuable tool for promoting threat-informed defense across organizations of all sizes.

---
