/*
 * Copyright 2026 LoverCraft
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {ref, watch} from "vue";

/**
 * The viewer's own map toggles: player heads on or off, and the zone grid shown, shown only for the zone under
 * the cursor, or hidden. Each viewer's choice is kept in their browser; storage can be missing or throw (private
 * windows, blocked site data), in which case the defaults simply apply again next visit.
 */
export type ZonesMode = 'shown' | 'hover' | 'hidden';

/** Id of the marker set holding the zone grid (served by the map's web server as markers.json) */
export const ZONES_SET_ID = 'zones';

export const ZONES_MODES: ZonesMode[] = ['shown', 'hover', 'hidden'];

const PLAYERS_KEY = 'lf-map-players',
	ZONES_KEY = 'lf-map-zones';

const read = (key: string): string | null => {
	try {
		return window.localStorage.getItem(key);
	} catch (e) {
		return null;
	}
};

const write = (key: string, value: string) => {
	try {
		window.localStorage.setItem(key, value);
	} catch (e) {
		// Not stored: the choice still holds until the page is closed
	}
};

const savedZones = read(ZONES_KEY);

export const playersShown = ref(read(PLAYERS_KEY) !== 'hidden');
export const zonesMode = ref<ZonesMode>(ZONES_MODES.includes(savedZones as ZonesMode) ? savedZones as ZonesMode : 'hover');

watch(playersShown, shown => write(PLAYERS_KEY, shown ? 'shown' : 'hidden'));
watch(zonesMode, mode => write(ZONES_KEY, mode));
