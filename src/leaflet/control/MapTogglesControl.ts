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

import {Control, ControlOptions, DomEvent, DomUtil} from 'leaflet';
import {ZonesMode} from "@/util/mapToggles";
import '@/assets/icons/players.svg';
import '@/assets/icons/zones.svg';

export interface MapTogglesControlOptions extends ControlOptions {
	onPlayersClick: () => void;
	onZonesClick: () => void;
}

export const PLAYERS_LABELS = {shown: 'Players: shown', hidden: 'Players: hidden'};

export const ZONES_LABELS: Record<ZonesMode, string> = {
	shown: 'Zones: shown',
	hover: 'Zones: only under the cursor',
	hidden: 'Zones: hidden',
};

/**
 * Leaflet map control with two buttons, stacked under the zoom buttons: player heads on or off, and the zone grid
 * shown, hover-only or hidden. A short note beside the buttons says what a click switched to.
 */
export class MapTogglesControl extends Control {
	declare options: MapTogglesControlOptions;

	private _container?: HTMLElement;
	private _playersButton?: HTMLButtonElement;
	private _zonesButton?: HTMLButtonElement;
	private _note?: HTMLElement;
	private _noteTimeout?: number;

	constructor(options: MapTogglesControlOptions) {
		super(options);
	}

	onAdd() {
		const container = this._container = DomUtil.create('div', 'leaflet-bar leaflet-control-toggles');

		this._playersButton = MapTogglesControl.createButton(container, 'players', () => this.options.onPlayersClick());
		this._zonesButton = MapTogglesControl.createButton(container, 'zones', () => this.options.onZonesClick());

		this._note = DomUtil.create('span', 'leaflet-control-toggles__note', container);
		this._note.setAttribute('role', 'status');
		this._note.setAttribute('aria-live', 'polite');

		DomEvent.disableClickPropagation(container);
		DomEvent.disableScrollPropagation(container);

		return container;
	}

	onRemove() {
		window.clearTimeout(this._noteTimeout);
	}

	setPlayers(shown: boolean, available: boolean) {
		if(!this._playersButton) {
			return;
		}

		this._playersButton.hidden = !available;
		this._playersButton.setAttribute('aria-pressed', String(shown));
		this._playersButton.title = PLAYERS_LABELS[shown ? 'shown' : 'hidden'];
		this._playersButton.setAttribute('aria-label', this._playersButton.title);
		this.updateShape();
	}

	setZones(mode: ZonesMode, available: boolean) {
		if(!this._zonesButton) {
			return;
		}

		this._zonesButton.hidden = !available;
		this._zonesButton.dataset.mode = mode;
		this._zonesButton.setAttribute('aria-pressed', mode === 'hidden' ? 'false' : (mode === 'hover' ? 'mixed' : 'true'));
		this._zonesButton.title = ZONES_LABELS[mode];
		this._zonesButton.setAttribute('aria-label', this._zonesButton.title);
		this.updateShape();
	}

	// Rounded as one bar whatever is showing: the Eternal world has no zone grid, so only one button shows there
	private updateShape() {
		if(!this._container) {
			return;
		}

		const shown = [this._playersButton, this._zonesButton].filter(button => button && !button.hidden).length;

		this._container.hidden = !shown;
		this._container.classList.toggle('leaflet-control-toggles--single', shown === 1);
	}

	showNote(text: string) {
		if(!this._note) {
			return;
		}

		this._note.textContent = text;
		this._note.classList.add('leaflet-control-toggles__note--visible');
		window.clearTimeout(this._noteTimeout);
		this._noteTimeout = window.setTimeout(
			() => this._note?.classList.remove('leaflet-control-toggles__note--visible'), 1600);
	}

	private static createButton(container: HTMLElement, icon: string, onClick: () => void): HTMLButtonElement {
		const button = DomUtil.create('button',
			`leaflet-control-button leaflet-control-toggles__${icon}`, container) as HTMLButtonElement;

		button.type = 'button';
		button.innerHTML = `
		<svg class="svg-icon" aria-hidden="true">
		  <use xlink:href="#icon--${icon}" />
		</svg>`;

		button.addEventListener('click', e => {
			e.preventDefault();
			onClick();
		});

		return button;
	}
}
