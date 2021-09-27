import { LightningElement, api } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class MemoryGameTile extends LightningElement {
    @api tileIcon;
    @api tileId;
    @api showIcon;
    @api showTile;

    handleTileClick() {
        try {
            console.log("tileIcon: ", this.tileIcon);
            console.log("tileId: ", this.tileId);
            this.dispatchEvent(
                new CustomEvent("tileselect", {
                    detail: {
                        icon: this.tileIcon,
                        id: this.tileId
                    }
                })
            );
        } catch (ex) {
            console.error(ex);

            // show toast message
            this.dispatchEvent(
                new ShowToastEvent({
                    title: "Unexpected error occured!",
                    message: ex.message,
                    variant: "error"
                })
            );
        }
    }
}
