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
import {computed, defineComponent, onMounted, onUnmounted, watch} from "vue";
import {useStore} from "@/store";
import LiveAtlasLeafletMap from "@/leaflet/LiveAtlasLeafletMap";
import {MapTogglesControl, PLAYERS_LABELS, ZONES_LABELS} from "@/leaflet/control/MapTogglesControl";
import {playersShown, ZONES_MODES, ZONES_SET_ID, zonesMode} from "@/util/mapToggles";

export default defineComponent({
	props: {
		leaflet: {
			type: Object as () => LiveAtlasLeafletMap,
			required: true,
		}
	},

	setup(props) {
		const store = useStore(),
			playersAvailable = computed(() => store.getters.playerMarkersEnabled),
			// Only the Survival world has a zone grid, so the button hides on the others
			zonesAvailable = computed(() => store.state.markerSets.has(ZONES_SET_ID)),
			control = new MapTogglesControl({
				position: 'topleft',
				onPlayersClick: () => {
					playersShown.value = !playersShown.value;
					control.showNote(PLAYERS_LABELS[playersShown.value ? 'shown' : 'hidden']);
				},
				onZonesClick: () => {
					zonesMode.value = ZONES_MODES[(ZONES_MODES.indexOf(zonesMode.value) + 1) % ZONES_MODES.length];
					control.showNote(ZONES_LABELS[zonesMode.value]);
				},
			}),
			refresh = () => {
				control.setPlayers(playersShown.value, playersAvailable.value);
				control.setZones(zonesMode.value, zonesAvailable.value);
			};

		watch([playersShown, playersAvailable, zonesMode, zonesAvailable], refresh);

		onMounted(() => {
			props.leaflet.addControl(control);
			refresh();
		});
		onUnmounted(() => props.leaflet.removeControl(control));
	},

	render() {
		return null;
	}
})
</script>
