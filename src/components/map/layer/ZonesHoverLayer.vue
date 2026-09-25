<!--
  - Copyright 2026 LoverCraft
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

<script lang="ts">
import {computed, defineComponent, onUnmounted, watch} from "vue";
import {LatLng, LeafletMouseEvent, Polygon, Tooltip} from "leaflet";
import {Coordinate, LiveAtlasAreaMarker, LiveAtlasPointMarker} from "@/index";
import {useStore} from "@/store";
import {nonReactiveState} from "@/store/state";
import {LiveAtlasMarkerType} from "@/util/markers";
import {ZONES_SET_ID, zonesMode} from "@/util/mapToggles";
import LiveAtlasLeafletMap from "@/leaflet/LiveAtlasLeafletMap";

/**
 * "Zones: only under the cursor". The full zone grid is off the map in this mode; instead the zone under the
 * cursor (or the one tapped, on a touch screen) gets its outline, and its name badge follows the cursor. The zone
 * is the smallest zone rectangle containing the point, so Spawn wins over the zone around it.
 */
export default defineComponent({
	props: {
		leaflet: {
			type: Object as () => LiveAtlasLeafletMap,
			required: true,
		}
	},

	setup(props) {
		const store = useStore(),
			currentMap = computed(() => store.state.currentMap),
			label = new Tooltip({
				direction: 'right',
				offset: [18, 0],
				permanent: true,
				interactive: false,
				className: 'leaflet-tooltip-zone',
			});

		let outline: Polygon | undefined,
			activeId: string | undefined,
			listening = false;

		const contains = (area: LiveAtlasAreaMarker, x: number, z: number) =>
			x >= area.bounds.min.x && x <= area.bounds.max.x && z >= area.bounds.min.z && z <= area.bounds.max.z;

		const size = (area: LiveAtlasAreaMarker) =>
			(area.bounds.max.x - area.bounds.min.x) * (area.bounds.max.z - area.bounds.min.z);

		const zoneAt = (areas: LiveAtlasAreaMarker[], x: number, z: number): LiveAtlasAreaMarker | undefined =>
			areas.filter(area => contains(area, x, z))
				.reduce<LiveAtlasAreaMarker | undefined>((best, area) => !best || size(area) < size(best) ? area : best, undefined);

		const clear = () => {
			outline?.remove();
			outline = undefined;
			activeId = undefined;
			props.leaflet.closeTooltip(label);
		};

		const labelFor = (zone: LiveAtlasAreaMarker, areas: LiveAtlasAreaMarker[], badges: LiveAtlasPointMarker[]) => {
			// The zone's own badge: a badge counts for the smallest zone around it, as with the zone itself
			const badge = badges.find(point => zoneAt(areas, point.location.x, point.location.z) === zone),
				element = document.createElement('div');

			if(badge) {
				const image = document.createElement('img');
				image.src = badge.iconUrl;
				image.alt = zone.tooltip;

				// The same size the grid shows it at: badge images are drawn at twice that, to stay sharp
				if(badge.iconSize) {
					image.width = badge.iconSize[0];
					image.height = badge.iconSize[1];
				}

				element.appendChild(image);
			} else {
				element.className = 'leaflet-tooltip-zone__text';
				element.textContent = zone.tooltip;
			}

			return element;
		};

		const onMove = (e: LeafletMouseEvent) => {
			const map = currentMap.value,
				markers = nonReactiveState.markers.get(ZONES_SET_ID);

			if(!map || !markers) {
				clear();
				return;
			}

			const areas: LiveAtlasAreaMarker[] = [],
				badges: LiveAtlasPointMarker[] = [];

			markers.forEach(marker => {
				if(marker.type === LiveAtlasMarkerType.AREA) {
					areas.push(marker as LiveAtlasAreaMarker);
				} else if(marker.type === LiveAtlasMarkerType.POINT) {
					badges.push(marker as LiveAtlasPointMarker);
				}
			});

			const location = map.latLngToLocation(e.latlng, 64),
				zone = zoneAt(areas, location.x, location.z);

			if(!zone) {
				clear();
				return;
			}

			if(zone.id !== activeId) {
				clear();
				activeId = zone.id;

				const convert = (point: Coordinate): LatLng => map.locationToLatLng(point),
					points = Array.isArray(zone.points[0])
						? (zone.points as Coordinate[][]).map(ring => ring.map(convert))
						: (zone.points as Coordinate[]).map(convert);

				outline = new Polygon(points, {...zone.style, fill: false, interactive: false}).addTo(props.leaflet);
				label.setContent(labelFor(zone, areas, badges));
			}

			label.setLatLng(e.latlng);
			props.leaflet.openTooltip(label);
		};

		const onLeave = () => clear();

		const listen = (on: boolean) => {
			if(on === listening) {
				return;
			}

			listening = on;

			if(on) {
				// click as well as mousemove: a tap on a touch screen picks the zone there
				props.leaflet.on('mousemove', onMove);
				props.leaflet.on('click', onMove);
				props.leaflet.getContainer().addEventListener('mouseleave', onLeave);
			} else {
				props.leaflet.off('mousemove', onMove);
				props.leaflet.off('click', onMove);
				props.leaflet.getContainer().removeEventListener('mouseleave', onLeave);
				clear();
			}
		};

		watch(zonesMode, mode => listen(mode === 'hover'), {immediate: true});
		watch(currentMap, () => clear());

		onUnmounted(() => listen(false));
	},

	render() {
		return null;
	}
})
</script>
