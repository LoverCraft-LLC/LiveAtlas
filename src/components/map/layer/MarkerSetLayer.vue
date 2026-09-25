<!--
  - Copyright 2022 James Lyne
  -
  - Licensed under the Apache License, Version 2.0 (the "License");
  - you may not use this file except in compliance with the License.
  - You may obtain a copy of the License at
  -
  - http://www.apache.org/licenses/LICENSE-2.0
  -
  - Unless required by applicable law or agreed to in writing, software
  - distributed under the License is distributed on an "AS IS" BASIS,
  - WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  - See the License for the specific language governing permissions and
  - limitations under the License.
  -->

<template>
	<MapMarkers :layer-group="layerGroup" :set="markerSet"></MapMarkers>
</template>

<script lang="ts">
import {defineComponent, computed, onMounted, onUnmounted, watch} from "vue";
import {LiveAtlasMarkerSet} from "@/index";
import {useStore} from "@/store";
import LiveAtlasLeafletMap from "@/leaflet/LiveAtlasLeafletMap";
import LiveAtlasLayerGroup from "@/leaflet/layer/LiveAtlasLayerGroup";
import MapMarkers from "@/components/map/marker/MapMarkers.vue";
import {ZONES_SET_ID, zonesMode} from "@/util/mapToggles";

export default defineComponent({
	components: {
		MapMarkers,
	},

	props: {
		leaflet: {
			type: Object as () => LiveAtlasLeafletMap,
			required: true,
		},

		markerSet: {
			type: Object as () => LiveAtlasMarkerSet,
			required: true,
		}
	},

	setup(props) {
		const store = useStore(),
			markerSettings = computed(() => store.state.components.markers),
			layerGroup = new LiveAtlasLayerGroup({
				id: props.markerSet.id,
				minZoom: props.markerSet.minZoom,
				maxZoom: props.markerSet.maxZoom,
				showLabels: props.markerSet.showLabels || store.state.components.markers.showLabels,
				priority: props.markerSet.priority,
			});

		// The zone grid follows the viewer's zones toggle: the whole grid is on the map only when "shown"
		// ("only under the cursor" draws just the one zone, in ZonesHoverLayer)
		const isZones = props.markerSet.id === ZONES_SET_ID,
			hiddenByToggle = () => isZones && zonesMode.value !== 'shown';

		watch(props.markerSet, newValue => {
			if(newValue && layerGroup) {
				layerGroup.update({
					id: props.markerSet.id,
					minZoom: props.markerSet.minZoom,
					maxZoom: props.markerSet.maxZoom,
					showLabels: props.markerSet.showLabels || store.state.components.markers.showLabels,
					priority: props.markerSet.priority,
				});

				if(newValue.hidden || hiddenByToggle()) {
					props.leaflet.getLayerManager()
						.addHiddenLayer(layerGroup, newValue.label, props.markerSet.priority);
				} else {
					props.leaflet.getLayerManager()
						.addLayer(layerGroup, true, newValue.label, props.markerSet.priority);
				}
			}
		}, {deep: true});

		if(isZones) {
			watch(zonesMode, () => {
				if(props.markerSet.hidden || hiddenByToggle()) {
					props.leaflet.removeLayer(layerGroup);
				} else {
					props.leaflet.getLayerManager()
						.addLayer(layerGroup, true, props.markerSet.label, props.markerSet.priority);
				}
			});
		}

		onMounted(() => {
			if(props.markerSet.hidden || hiddenByToggle()) {
				props.leaflet.getLayerManager()
					.addHiddenLayer(layerGroup, props.markerSet.label, props.markerSet.priority);
			} else {
				props.leaflet.getLayerManager()
					.addLayer(layerGroup, true, props.markerSet.label, props.markerSet.priority);
			}
		});

		onUnmounted(() => props.leaflet.getLayerManager().removeLayer(layerGroup));

		return {
			markerSettings,
			layerGroup,
		}
	},
	render() {
		return null;
	}
})
</script>
