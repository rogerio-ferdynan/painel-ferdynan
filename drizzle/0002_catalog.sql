CREATE TABLE panel_catalog_snapshots (id TEXT PRIMARY KEY NOT NULL,summary TEXT NOT NULL,created_at TEXT NOT NULL,status TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE panel_catalog_active (id TEXT PRIMARY KEY NOT NULL,snapshot TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE panel_catalog_nodes (snapshot TEXT NOT NULL,id TEXT NOT NULL,parent TEXT NOT NULL,name TEXT NOT NULL,module TEXT NOT NULL,kind TEXT NOT NULL,size INTEGER NOT NULL,modified_at TEXT NOT NULL,search TEXT NOT NULL,PRIMARY KEY(snapshot,id));
--> statement-breakpoint
CREATE INDEX panel_catalog_parent ON panel_catalog_nodes(snapshot,parent,kind);
--> statement-breakpoint
CREATE INDEX panel_catalog_module ON panel_catalog_nodes(snapshot,module,kind);
--> statement-breakpoint
CREATE TABLE panel_catalog_links (snapshot TEXT NOT NULL,id TEXT NOT NULL,title TEXT NOT NULL,url TEXT NOT NULL,module TEXT NOT NULL,modules TEXT NOT NULL,folders TEXT NOT NULL,folder_ids TEXT NOT NULL,aliases TEXT NOT NULL,search TEXT NOT NULL,PRIMARY KEY(snapshot,id));
