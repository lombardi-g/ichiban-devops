import pandas as pd

data = pd.read_csv("appearances.csv", sep=';')

players = data["Name"].unique()

count_towards_atbats = ["1b", "2b", "3b", "HR", "K", "ROE", "RFC", "GO", "FO"]
count_as_hits = ["1b", "2b", "3b", "HR"]
on_base = ["1b", "2b", "3b", "HR", "BB", "HBP"]

plate_appearances = data.groupby("Name").size()
atbats = data[data["Appearance"].isin(count_towards_atbats)].groupby("Name").size()
hits = data[data["Appearance"].isin(count_as_hits)].groupby("Name").size()
got_on_base = data[data["Appearance"].isin(on_base)].groupby("Name").size()

strikeouts = data[data["Appearance"]=="K"].groupby("Name").size()
stolen_bases = data.groupby("Name")["SB"].sum()
stolen_base_attempts = data.groupby("Name")["SBA"].sum()

average = (hits/atbats).round(3)
on_base_percentage = (got_on_base/plate_appearances).round(3)

singles = data[data["Appearance"] == "1b"].groupby("Name").size().reindex(atbats.index, fill_value=0)
doubles = data[data["Appearance"] == "2b"].groupby("Name").size().reindex(atbats.index, fill_value=0)
triples = data[data["Appearance"] == "3b"].groupby("Name").size().reindex(atbats.index, fill_value=0)
homeruns = data[data["Appearance"] == "HR"].groupby("Name").size().reindex(atbats.index, fill_value=0)

total_bases = singles*1 + doubles*2 + triples*3 + homeruns*4
slugging = (total_bases / atbats).round(3)

on_base_plus_slugging = on_base_percentage + slugging

# RISP stats
data_RISPonly = data[data["RISP"] == True]
RISP_strikeouts = data_RISPonly[data_RISPonly["Appearance"]=="K"].groupby("Name").size()
RISP_atbats = data_RISPonly[data_RISPonly["Appearance"].isin(count_towards_atbats)].groupby("Name").size()
RISP_hits = data_RISPonly[data_RISPonly["Appearance"].isin(count_as_hits)].groupby("Name").size()
RISP_gotonbase = data_RISPonly[data_RISPonly["Appearance"].isin(on_base)].groupby("Name").size()
RISP_stolenbases = data_RISPonly.groupby("Name")["SB"].sum()
RISP_stolenbaseattemps = data_RISPonly.groupby("Name")["SBA"].sum()

RISP_singles = data_RISPonly[data_RISPonly["Appearance"] == "1b"].groupby("Name").size().reindex(atbats.index, fill_value=0)
RISP_doubles = data_RISPonly[data_RISPonly["Appearance"] == "2b"].groupby("Name").size().reindex(atbats.index, fill_value=0)
RISP_triples = data_RISPonly[data_RISPonly["Appearance"] == "3b"].groupby("Name").size().reindex(atbats.index, fill_value=0)
RISP_homeruns = data_RISPonly[data_RISPonly["Appearance"] == "HR"].groupby("Name").size().reindex(atbats.index, fill_value=0)

RISP_average = (RISP_hits/RISP_atbats).round(3)
RISP_plate_appearances = data_RISPonly.groupby("Name").size()
RISP_obp = (RISP_gotonbase / RISP_plate_appearances).round(3)

RISP_totalbases = RISP_singles*1 + RISP_doubles*2 + RISP_triples*3 + RISP_homeruns*4
RISP_slugging = (RISP_totalbases / RISP_atbats).round(3)

RISP_ops = RISP_obp + RISP_slugging