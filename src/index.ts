import { ClientMethod, SharedClass, SharedMethod, StartClient, StartServer } from "@rbxts/shared-class";
import { OnlyClient } from "./utils";
import { Players, RunService } from "@rbxts/services";

type Constructor<T extends object> = new (...args: never[]) => T;

const localPlayer = Players.LocalPlayer;
RunService.IsServer() ? StartServer() : StartClient();

export abstract class VisualEffect<T extends object = {}> {
	protected config!: T;
	constructor(config: T) {
		this.SetConfig(config);
	}

	protected abstract OnStart(): void;

	@SharedMethod()
	public SetConfig(NewConfig: T) {
		this.config = NewConfig;
		table.freeze(this.config);
	}

	public GetConfig() {
		return this.config;
	}

	/** @client */
	@OnlyClient
	public Start() {
		this.OnStart();
	}

	@ClientMethod()
	/** @server */
	public Broadcast() {
		this.Start();
	}

	@ClientMethod()
	/** @server */
	public Fire(Player: Player | Player[]) {
		if (typeIs(Player, "Instance")) {
			if (localPlayer !== Player) return;
		} else {
			if (!Player.includes(localPlayer)) return;
		}
		this.Start();
	}

	@ClientMethod()
	/** @server */
	public Except(Player: Player | Player[]) {
		if (typeIs(Player, "Instance")) {
			if (localPlayer === Player) return;
		} else {
			if (Player.includes(localPlayer)) return;
		}
		this.Start();
	}

	@ClientMethod()
	/** @server */
	public FireInRadius(Origin: Vector3, Radius = 200) {
		Players.GetPlayers().forEach((Player) => {
			const character = Player.Character;
			if (!character) return;

			const characterPosition = character.PrimaryPart?.Position || character.GetPivot().Position;
			if (Origin.sub(characterPosition).Magnitude > Radius) return;
			this.Start();
		});
	}

	public Destroy() {}
}

export function VisualEffectDecorator<T extends Constructor<VisualEffect>>(Constuructor: T) {
	SharedClass({
		DestroyMethodName: "Destroy",
	})(Constuructor);
}
