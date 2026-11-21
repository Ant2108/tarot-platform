import json
import subprocess
import sys

CARDS_PATH = r"d:\New folder\tarot-platform\src\data\tarot-cards.json"

# Load current verified Vietnamese dataset
with open(CARDS_PATH, "r", encoding="utf-8") as f:
    vi_data = json.load(f)

# Import English generator dictionaries directly without overwriting files
import importlib.util
spec = importlib.util.spec_from_file_location(
    "gen_en", r"d:\New folder\tarot-platform\scripts\generate-tarot-data.py"
)

# Read SUIT_META, RANK_ARCHETYPES, MAJOR_DATA by executing just the dict definitions
with open(r"d:\New folder\tarot-platform\scripts\generate-tarot-data.py", "r", encoding="utf-8") as f:
    src = f.read().split("cards_out = []")[0]

ns = {}
exec(src, ns)
MAJOR_DATA = ns["MAJOR_DATA"]
SUIT_META = ns["SUIT_META"]
RANK_ARCHETYPES = ns["RANK_ARCHETYPES"]

for card in vi_data["cards"]:
    name = card["name"]
    arcana = card["arcana"]
    suit = card.get("suit")
    num = str(card["number"])

    if arcana == "Major Arcana" and name in MAJOR_DATA:
        m = MAJOR_DATA[name]
        card["en"] = {
            "keywords": {"upright": m["kw_up"], "reversed": m["kw_rev"]},
            "general": {"upright": m["gen_up"], "reversed": m["gen_rev"]},
            "topics": {
                "general": {"upright": m["gen_up"], "reversed": m["gen_rev"]},
                "love": {"upright": m["love_up"], "reversed": m["love_rev"]},
                "family": {"upright": m["fam_up"], "reversed": m["fam_rev"]},
                "career": {"upright": m["car_up"], "reversed": m["car_rev"]},
                "finance": {"upright": m["fin_up"], "reversed": m["fin_rev"]},
                "personalGrowth": {"upright": m["gro_up"], "reversed": m["gro_rev"]},
            },
        }
    elif suit in SUIT_META and num in RANK_ARCHETYPES:
        sm = SUIT_META[suit]
        rm = RANK_ARCHETYPES[num]
        gen_up = f"{name} {rm['up'].format(domain=sm['domain'])}"
        gen_rev = f"Reversed, {name} {rm['rev'].format(domain=sm['domain'])}"
        card["en"] = {
            "keywords": {
                "upright": rm["kw_up"] + [suit.lower()],
                "reversed": rm["kw_rev"] + [suit.lower()],
            },
            "general": {"upright": gen_up, "reversed": gen_rev},
            "topics": {
                "general": {"upright": gen_up, "reversed": gen_rev},
                "love": {
                    "upright": f"In love, {name} brings {rm['kw_up'][0]} and {rm['kw_up'][1]} to {sm['love_lens']}.",
                    "reversed": f"Reversed in love, {name} highlights {rm['kw_rev'][0]} around {sm['love_lens']}, inviting patient clarity.",
                },
                "family": {
                    "upright": f"Within family life, {name} supports {rm['kw_up'][0]} through {sm['fam_lens']}.",
                    "reversed": f"Reversed at home, {name} points to {rm['kw_rev'][0]} affecting {sm['fam_lens']}; gentle communication helps restore ease.",
                },
                "career": {
                    "upright": f"In career matters, {name} channels {rm['kw_up'][0]} and {rm['kw_up'][1]} into {sm['car_lens']}.",
                    "reversed": f"Reversed at work, {name} signals {rm['kw_rev'][0]} in {sm['car_lens']}; refine priorities before accelerating.",
                },
                "finance": {
                    "upright": f"Financially, {name} favors {rm['kw_up'][0]} guided by {sm['fin_lens']}.",
                    "reversed": f"Reversed in finance, {name} cautions against {rm['kw_rev'][0]} and invites reviewing {sm['fin_lens']}.",
                },
                "personalGrowth": {
                    "upright": f"For personal growth, {name} cultivates {rm['kw_up'][0]} via {sm['gro_lens']}.",
                    "reversed": f"Reversed on your inner path, {name} gently surfaces {rm['kw_rev'][0]} within {sm['gro_lens']} for compassionate reflection.",
                },
            },
        }

with open(CARDS_PATH, "w", encoding="utf-8") as f:
    json.dump(vi_data, f, indent=2, ensure_ascii=False)

print("Added bilingual EN fields to all", len(vi_data["cards"]), "cards.")
