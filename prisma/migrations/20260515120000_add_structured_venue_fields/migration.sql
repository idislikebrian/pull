ALTER TABLE "Campaign"
  ADD COLUMN "googlePlaceId" TEXT,
  ADD COLUMN "formattedAddress" TEXT,
  ADD COLUMN "latitude" DOUBLE PRECISION,
  ADD COLUMN "longitude" DOUBLE PRECISION,
  ADD COLUMN "neighborhood" TEXT,
  ADD COLUMN "countryCode" TEXT;

CREATE INDEX "Campaign_googlePlaceId_idx" ON "Campaign"("googlePlaceId");
CREATE INDEX "Campaign_latitude_longitude_idx" ON "Campaign"("latitude", "longitude");
CREATE INDEX "Campaign_countryCode_city_idx" ON "Campaign"("countryCode", "city");
