import argparse
import json
import re
import sys
from pathlib import Path
from xml.etree import ElementTree

from PIL import Image

SKIP_TYPES = {"music"}
SORT_FILE_RE = re.compile(r"Sort\.xml$", re.IGNORECASE)
TRAILING_ID_RE = re.compile(r"(\d+)$")
UI_REFERENCE_RE = re.compile(r"^UI_[A-Za-z0-9_]+$")

TYPE_TEXTURE_PREFIX = {
    "chara": "UI_Chara",
    "frame": "UI_Frame",
    "icon": "UI_Icon",
    "partner": "UI_Partner",
    "plate": "UI_Plate",
    "photoFrame": "UI_PhotoFrame",
}

TREASURE_TEXTURES = {
    "Character": ("CharacterId/id", "UI_Chara"),
    "Frame": ("Frame/id", "UI_Frame"),
    "NamePlate": ("NamePlate/id", "UI_Plate"),
    "Icon": ("Icon/id", "UI_Icon"),
    "MusicNew": ("MusicId/id", "UI_Jacket"),
    "MapTaskMusic": ("MusicId/id", "UI_Jacket"),
}

SHOP_TEXTURES = {
    "旅行伙伴": "UI_Chara",
    "搭档": "UI_Partner",
    "姓名框": "UI_Plate",
    "背景": "UI_Frame",
    "头像": "UI_Icon",
}

LOGIN_BONUS_TEXTURES = {
    "Partner": ("PartnerId/id", "UI_Partner"),
    "Frame": ("FrameId/id", "UI_Frame"),
    "Icon": ("IconId/id", "UI_Icon"),
    "Plate": ("PlateId/id", "UI_Plate"),
    "Character": ("CharacterId/id", "UI_Chara"),
    "MusicNew": ("MusicId/id", "UI_Jacket"),
}

TYPE_KIND_IDS = {
    "plate": 1,
    "title": 2,
    "icon": 3,
    "chara": 9,
    "partner": 10,
    "frame": 11,
    "ticket": 12,
}

TREASURE_KIND_IDS = {
    "NamePlate": 1,
    "Title": 2,
    "Icon": 3,
    "Present": 4,
    "MusicNew": 5,
    "MapTaskMusic": 5,
    "Character": 9,
    "Frame": 11,
}

SHOP_KIND_IDS = {
    "姓名框": 1,
    "称号": 2,
    "头像": 3,
    "礼物": 4,
    "旅行伙伴": 9,
    "搭档": 10,
    "背景": 11,
    "功能票": 12,
}

LOGIN_BONUS_KIND_IDS = {
    "Plate": 1,
    "Frame": 11,
    "Icon": 3,
    "Character": 9,
    "Partner": 10,
    "MusicNew": 5,
    "Ticket": 12,
}

PRIMARY_ORDER = ["icon", "plate", "frame", "chara", "partner", "title", "photoFrame"]
THUMB_SIZE = 256


def find_name(root: ElementTree.Element) -> str | None:
    for tag in ("name", "Name"):
        node = root.find(tag)
        if node is None:
            continue
        value = node.findtext("str")
        if value and value.strip():
            return value.strip()
    return None


def find_id(root: ElementTree.Element, fallback: str) -> int | None:
    for tag in ("name", "Name"):
        node = root.find(tag)
        if node is None:
            continue
        value = node.findtext("id")
        if value and value.strip().isdigit():
            return int(value.strip())
    match = TRAILING_ID_RE.search(fallback)
    if match:
        return int(match.group(1))
    return None


def find_texture_reference(root: ElementTree.Element, texture_names: set[str]) -> str | None:
    for node in root.iter():
        if node.text is None:
            continue
        value = node.text.strip()
        if UI_REFERENCE_RE.match(value) and value in texture_names:
            return value
    return None


def texture_for_id(
    prefix: str,
    item_id: int | None,
    texture_names: set[str],
) -> str | None:
    if item_id is None or item_id <= 0:
        return None
    candidate = f"{prefix}_{item_id:06d}"
    return candidate if candidate in texture_names else None


def id_from_text(value: str | None) -> int | None:
    if value is None:
        return None
    value = value.strip()
    return int(value) if value.isdigit() else None


def resolve_reward_texture(
    item_type: str,
    root: ElementTree.Element,
    texture_names: set[str],
) -> str | None:
    if item_type == "mapTreasure":
        treasure_type = (root.findtext("TreasureType") or "").strip()
        spec = TREASURE_TEXTURES.get(treasure_type)
        if spec is not None:
            field_path, prefix = spec
            return texture_for_id(
                prefix, id_from_text(root.findtext(field_path)), texture_names
            )

    if item_type == "shopItem":
        category = (root.findtext("shopItemCategoryName/str") or "").strip()
        prefix = SHOP_TEXTURES.get(category)
        if prefix is not None:
            return texture_for_id(
                prefix, id_from_text(root.findtext("itemId")), texture_names
            )

    if item_type == "loginBonus":
        bonus_type = (root.findtext("BonusType") or "").strip()
        spec = LOGIN_BONUS_TEXTURES.get(bonus_type)
        if spec is not None:
            field_path, prefix = spec
            return texture_for_id(
                prefix, id_from_text(root.findtext(field_path)), texture_names
            )

    return None


def resolve_kind_id(item_type: str, root: ElementTree.Element) -> int | None:
    if item_type in TYPE_KIND_IDS:
        return TYPE_KIND_IDS[item_type]

    if item_type == "mapTreasure":
        treasure_type = (root.findtext("TreasureType") or "").strip()
        return TREASURE_KIND_IDS.get(treasure_type)

    if item_type == "shopItem":
        category = (root.findtext("shopItemCategoryName/str") or "").strip()
        return SHOP_KIND_IDS.get(category)

    if item_type == "loginBonus":
        bonus_type = (root.findtext("BonusType") or "").strip()
        return LOGIN_BONUS_KIND_IDS.get(bonus_type)

    return None


def resolve_source_texture(
    item_type: str,
    item_id: int | None,
    root: ElementTree.Element,
    texture_names: set[str],
) -> str | None:
    prefix = TYPE_TEXTURE_PREFIX.get(item_type)
    if prefix is not None and item_id is not None:
        candidate = f"{prefix}_{item_id:06d}"
        if candidate in texture_names:
            return candidate

    reward_texture = resolve_reward_texture(item_type, root, texture_names)
    if reward_texture is not None:
        return reward_texture

    return find_texture_reference(root, texture_names)


def is_fresh(destination: Path, source: Path, force: bool) -> bool:
    return (
        not force
        and destination.exists()
        and destination.stat().st_mtime >= source.stat().st_mtime
    )


def convert_texture(
    source: Path,
    full_destination: Path,
    thumb_destination: Path,
    force: bool,
) -> tuple[bool, bool]:
    full_ok = is_fresh(full_destination, source, force)
    thumb_ok = is_fresh(thumb_destination, source, force)

    if full_ok and thumb_ok:
        return True, True

    try:
        with Image.open(source) as image:
            rgba = image.convert("RGBA")

            if not full_ok:
                full_destination.parent.mkdir(parents=True, exist_ok=True)
                rgba.save(full_destination, "WEBP", quality=80, method=4)
                full_ok = True

            if not thumb_ok:
                thumbnail = rgba.copy()
                thumbnail.thumbnail((THUMB_SIZE, THUMB_SIZE), Image.Resampling.LANCZOS)
                thumb_destination.parent.mkdir(parents=True, exist_ok=True)
                thumbnail.save(thumb_destination, "WEBP", quality=80, method=4)
                thumb_ok = True
    except Exception as error:
        print(f"  failed {source.name}: {error}", file=sys.stderr)

    return full_ok, thumb_ok


def parse_items(
    data_dir: Path,
    textures_dir: Path,
) -> tuple[list[dict[str, object]], dict[str, Path], int]:
    texture_names = {
        path.stem for path in textures_dir.iterdir() if path.suffix.lower() == ".png"
    }
    items: list[dict[str, object]] = []
    sources: dict[str, Path] = {}
    skipped = 0

    for type_dir in sorted(data_dir.iterdir()):
        if not type_dir.is_dir() or type_dir.name in SKIP_TYPES:
            continue

        type_count = 0
        for xml_path in sorted(type_dir.rglob("*.xml")):
            if SORT_FILE_RE.search(xml_path.name):
                skipped += 1
                continue

            try:
                root = ElementTree.parse(xml_path).getroot()
            except ElementTree.ParseError as error:
                print(f"  skip {xml_path}: {error}", file=sys.stderr)
                skipped += 1
                continue

            if root.tag == "SerializeSortData":
                skipped += 1
                continue

            folder_name = xml_path.parent.name if xml_path.parent != type_dir else xml_path.stem
            data_name = (root.findtext("dataName") or folder_name).strip()

            item_id = find_id(root, data_name)
            rarity = (root.findtext("rareType") or "").strip() or None
            unlock = (root.findtext("normText") or "").strip() or None
            locked = (root.findtext("dispCond") or "").strip() == "Lock"
            item = {
                "type": type_dir.name,
                "id": item_id,
                "name": find_name(root) or data_name,
                "dataName": data_name,
                "xml": xml_path.relative_to(data_dir).as_posix(),
                "rarity": rarity,
                "kindId": resolve_kind_id(type_dir.name, root),
                "unlock": unlock,
                "locked": locked,
                "image": None,
                "thumb": None,
            }

            texture_name = resolve_source_texture(
                type_dir.name, item_id, root, texture_names
            )
            if texture_name is not None:
                sources[texture_name] = textures_dir / f"{texture_name}.png"
                item["image"] = f"/assets/textures/{texture_name}.webp"
                item["thumb"] = f"/assets/thumbs/{texture_name}.webp"

            items.append(item)
            type_count += 1

        print(f"  {type_dir.name:24} {type_count:5} items")

    return items, sources, skipped


def has_visible_content(path: Path) -> bool:
    try:
        with Image.open(path) as image:
            if "A" in image.getbands():
                return image.getchannel("A").getbbox() is not None
            return True
    except Exception:
        return True


def write_json(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Build item JSON, search index and WebP assets")
    parser.add_argument(
        "--data-dir",
        required=True,
        help="game XML data directory",
    )
    parser.add_argument(
        "--textures-dir",
        required=True,
        help="extracted texture directory",
    )
    parser.add_argument(
        "--out-dir",
        default=str(Path(__file__).resolve().parent.parent),
        help="project root",
    )
    parser.add_argument("--force", action="store_true", help="reconvert all textures")
    args = parser.parse_args()

    data_dir = Path(args.data_dir)
    textures_dir = Path(args.textures_dir)
    out_dir = Path(args.out_dir)

    if not data_dir.is_dir():
        raise SystemExit(f"data directory not found: {data_dir}")
    if not textures_dir.is_dir():
        raise SystemExit(f"texture directory not found: {textures_dir}")

    print("Parsing XML...")
    items, sources, skipped = parse_items(data_dir, textures_dir)

    print(f"\nConverting {len(sources)} textures (full + {THUMB_SIZE}px thumbs)...")
    full_dir = out_dir / "public" / "assets" / "textures"
    thumb_dir = out_dir / "public" / "assets" / "thumbs"
    status: dict[str, tuple[bool, bool]] = {}

    for index, (name, source) in enumerate(sources.items(), start=1):
        status[name] = convert_texture(
            source,
            full_dir / f"{name}.webp",
            thumb_dir / f"{name}.webp",
            args.force,
        )
        if index % 200 == 0 or index == len(sources):
            print(f"  {index}/{len(sources)}")

    for item in items:
        image = item["image"]
        thumb = item["thumb"]
        if not isinstance(image, str):
            continue
        stem = Path(image).stem
        full_ok, thumb_ok = status.get(stem, (False, False))
        if not full_ok:
            item["image"] = None
            item["thumb"] = None
            continue
        if not thumb_ok:
            item["thumb"] = image

    grouped: dict[str, list[dict[str, object]]] = {}
    for item in items:
        grouped.setdefault(str(item["type"]), []).append(item)

    types_dir = out_dir / "public" / "data" / "types"
    types_dir.mkdir(parents=True, exist_ok=True)
    for stale in types_dir.glob("*.json"):
        stale.unlink()

    for key, type_items in grouped.items():
        write_json(types_dir / f"{key}.json", type_items)

    primary_rank = {key: index for index, key in enumerate(PRIMARY_ORDER)}
    manifest_types = []
    for key, type_items in grouped.items():
        preview: list[str] = []
        for item in type_items:
            thumb = item["thumb"]
            if not isinstance(thumb, str):
                continue
            thumb_path = out_dir / "public" / thumb.lstrip("/")
            if not has_visible_content(thumb_path):
                continue
            preview.append(thumb)
            if len(preview) == 4:
                break

        manifest_types.append(
            {
                "key": key,
                "count": len(type_items),
                "imageCount": sum(1 for item in type_items if item["image"]),
                "preview": preview,
                "primary": key in primary_rank,
            }
        )

    manifest_types.sort(
        key=lambda entry: (
            0 if entry["primary"] else 1,
            primary_rank.get(str(entry["key"]), 0) if entry["primary"] else -int(entry["count"]),
            str(entry["key"]),
        )
    )

    manifest = {
        "total": len(items),
        "imageCount": sum(1 for item in items if item["image"]),
        "textureCount": len(sources),
        "types": manifest_types,
    }
    write_json(out_dir / "public" / "data" / "manifest.json", manifest)

    search_index = [
        {
            "type": item["type"],
            "id": item["id"],
            "name": item["name"],
            "dataName": item["dataName"],
            "thumb": item["thumb"] or None,
            "rarity": item["rarity"],
        }
        for item in items
    ]
    write_json(out_dir / "public" / "data" / "search.json", search_index)

    legacy = out_dir / "public" / "data" / "items.json"
    if legacy.exists():
        legacy.unlink()

    with_image = sum(1 for item in items if item["image"])
    print(f"\nWrote {len(items)} items ({with_image} with image) across {len(grouped)} types")
    print(f"Data directory: {out_dir / 'public' / 'data'}")
    print(f"Skipped {skipped} sort/empty files")


if __name__ == "__main__":
    main()
