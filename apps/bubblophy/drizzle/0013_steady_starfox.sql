CREATE INDEX "bubblophy_agent_tokens_project_label_idx" ON "bubblophy_agent_tokens" USING btree ("project_id",lower("label"),"id");
