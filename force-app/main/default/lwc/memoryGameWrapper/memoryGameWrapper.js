import { LightningElement, track, api } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

// resources
import EMOJIS from "@salesforce/resourceUrl/Emojis";

// constants
const DEFAULT_GRID_SIZE = 4;
const GAME_OVER_MESSAGE = "Game Over!";
const SUCCESS_VARIANT = "success";
const ERROR_VARIANT = "error";
const SUMMER = "summer";
const RAINY = "rainy";
const WINTER = "winter";
const SPRING = "spring";

export default class MemoryGameWrapper extends LightningElement {
    @track iconList;
    @track tileIconArray;

    gridSize;
    tileCount;
    clicksCount;

    currentTileIcon;
    currentTileId;
    previousTileIcon;
    previousTileId;

    @track startTime;
    @track endTime;

    constructor() {
        super();

        // initialize private variables
        this.iconList = [];
        this.tileIconArray = [];
        this.gridSize = DEFAULT_GRID_SIZE;
        this.tileCount = 0;
        this.clicksCount = 0;
        this.currentTileIcon = "";
        this.currentTileId = "";
        this.previousTileIcon = "";
        this.previousTileId = "";
        this.startTime = null;
        this.endTime = null;
    }

    connectedCallback() {
        if (this.template.isConnected) {
            this.getEmojisFromStaticResource();
        }
    }

    getEmojisFromStaticResource() {
        const request = new XMLHttpRequest();
        request.open("GET", EMOJIS, true);
        request.onload = (event) => {
            if (request.readyState === 4) {
                if (request.status === 200) {
                    const iconList = JSON.parse(request.responseText).iconList;
                    this.iconList = this.getSeasonalIcons(iconList);
                    this.shuffleIconList(this.iconList);
                } else {
                    console.error(request.statusText);

                    // show toast message
                    this.displayToastMessage(
                        "Error loading Emojis",
                        request.statusText,
                        ERROR_VARIANT
                    );
                }
            }
        };
        request.onerror = (event) => {
            console.error(request.statusText);

            // show toast message
            this.displayToastMessage(
                "Error loading Emojis",
                request.statusText,
                ERROR_VARIANT
            );
        };
        request.send(null);
    }

    shuffleIconList(icons) {
        let shuffledIconList = this.fisherYatesShuffle(icons);
        shuffledIconList.length = this.gridSize * 2;
        shuffledIconList = [
            ...shuffledIconList,
            ...this.fisherYatesShuffle(shuffledIconList)
        ];

        this.tileCount = shuffledIconList.length;
        this.populateTileIconArray(shuffledIconList);
    }

    populateTileIconArray(shuffledIconList) {
        let tileIconArray = [];
        shuffledIconList.forEach((element, index) => {
            tileIconArray.push({
                icon: element,
                showTile: true,
                showIcon: false,
                tileId: index
            });
        });
        this.tileIconArray = tileIconArray;
    }

    handleTileSelect(event) {
        const currentTileIcon = event.detail.icon;
        const currentTileId = event.detail.id;
        const previousTileIcon = this.previousTileIcon;
        const previousTileId = this.previousTileId;

        this.currentTileIcon = currentTileIcon;
        this.currentTileId = currentTileId;
        this.previousTileIcon = currentTileIcon;
        this.previousTileId = currentTileId;

        this.clicksCount++;

        const currentTile = this.tileIconArray.find(
            (tileIcon) => tileIcon.tileId === currentTileId
        );
        currentTile.showIcon = true;
        this.tileIconArray.splice(currentTile.tileId, 1, currentTile);

        if (this.clicksCount === 1) {
            this.startTime = Date.now();
        } else if (this.clicksCount % 2 === 0) {
            const previousTile = this.tileIconArray.find(
                (tileIcon) => tileIcon.tileId === previousTileId
            );

            if (currentTileIcon !== previousTileIcon) {
                // showIcon = false : Icons did not match
                setTimeout(() => {
                    currentTile.showIcon = false;
                    previousTile.showIcon = false;
                }, 600);
            } else if (
                currentTileIcon === previousTileIcon &&
                currentTileId !== previousTileId
            ) {
                // showTile = false : Match found
                setTimeout(() => {
                    currentTile.showTile = false;
                    previousTile.showTile = false;
                    this.tileCount -= 2;

                    if (this.tileCount === 0) {
                        // No tiles left to click
                        this.endTime = Date.now();
                        const timeTaken =
                            (this.endTime - this.startTime) / 1000;
                        this.displayToastMessage(
                            GAME_OVER_MESSAGE,
                            `Time taken: ${timeTaken} seconds! Refresh The Page To Start A New Game...`,
                            SUCCESS_VARIANT
                        );
                    }
                }, 600);
            } else if (currentTileId === previousTileId) {
                // showIcon = false : Clicked on same tile twice
                currentTile.showIcon = false;
                previousTile.showIcon = false;
            }
        }
    }

    getSeasonalIcons(iconList) {
        let seasonName = "";
        const currentMonth = new Date().getMonth();

        if (currentMonth >= 0 && currentMonth < 3) {
            seasonName = WINTER;
        } else if (currentMonth >= 3 && currentMonth < 6) {
            seasonName = SUMMER;
        } else if (currentMonth >= 6 && currentMonth < 9) {
            seasonName = RAINY;
        } else if (currentMonth >= 9 && currentMonth < 12) {
            seasonName = SPRING;
        }

        const seasonObj = iconList.find(
            (item) => item.seasonName === seasonName
        );
        return seasonObj && seasonObj.icons;
    }

    fisherYatesShuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }

    displayToastMessage(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
