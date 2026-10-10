"""Bande-son synthétique du clip Cercle IA EdG-T : tout est calculé, aucun échantillon externe.

    python3 outils/bande-son.py        écrit assets/bande-son.wav (48 kHz, stéréo, 15 s)

Les temps reprennent la table T de index.html. Si le rythme du clip change, les reporter ici.
"""
import os
import numpy as np
from scipy import signal
from scipy.io import wavfile

FE, DUREE = 48000, 15.0
N = int(FE * DUREE)
T = dict(coupe2=3.0, coupe3=6.0, coupe4=10.0, bati=0.08, cadence=0.92, lignes=3.4, pas=0.25,
         train_entre=6.0, train_arret=7.5, train_part=8.5, train_sortie=2.6, p3=7.5, carte=10.25)
NIVEAU = 0.5                     # crête de sortie ; réglée pour viser -16 LUFS environ
alea = np.random.default_rng(7)
mix = np.zeros((N, 2))
aux = np.zeros((N, 2))            # départ vers la réverbération


def note(demi_tons_depuis_la3):
    return 440.0 * 2 ** (demi_tons_depuis_la3 / 12)


def temps(n):
    return np.arange(n) / FE


def filtre(x, genre, f, ordre=2):
    return signal.sosfilt(signal.butter(ordre, f, genre, fs=FE, output="sos"), x)


def bruit(n):
    return alea.standard_normal(n)


def poser(x, debut, gain=1.0, pan=0.0, reverb=0.0):
    """Ajoute un son mono à l'instant voulu. pan : -1 gauche, +1 droite (puissance constante)."""
    i = int(debut * FE)
    if i >= N:
        return
    x = x[: N - i]
    a = (pan + 1) * np.pi / 4
    st = np.stack([x * np.cos(a), x * np.sin(a)], axis=1) * gain
    mix[i:i + len(x)] += st
    aux[i:i + len(x)] += st * reverb


def enveloppe(n, attaque, chute):
    t = temps(n)
    return np.minimum(1, t / max(attaque, 1e-4)) * np.exp(-np.maximum(0, t - attaque) / chute)


def impact(grave=55.0, aigu=170.0, duree=0.5, bruit_niveau=0.5):
    """Coup sourd : sinus qui descend + souffle court."""
    n = int(duree * FE)
    t = temps(n)
    f = grave + (aigu - grave) * np.exp(-t / 0.035)
    corps = np.sin(2 * np.pi * np.cumsum(f) / FE) * np.exp(-t / (duree * 0.28))
    souffle = filtre(bruit(n), "low", 900) * np.exp(-t / 0.03) * bruit_niveau
    return corps + souffle


def cloche(f, duree=1.6):
    """Note de cloche douce : quelques partiels inharmoniques qui s'éteignent."""
    n = int(duree * FE)
    t = temps(n)
    s = np.zeros(n)
    for rapport, niveau, chute in ((1, 1.0, 0.55), (2.0, 0.42, 0.32), (3.01, 0.2, 0.2), (4.2, 0.1, 0.12), (5.4, 0.05, 0.08)):
        s += niveau * np.sin(2 * np.pi * f * rapport * t) * np.exp(-t / chute)
    return s * np.minimum(1, t / 0.004)


def nappe(frequences, duree, attaque, coupure, desaccord=0.004):
    """Accord tenu : dents de scie désaccordées, filtrées."""
    n = int(duree * FE)
    t = temps(n)
    g = np.zeros(n)
    d = np.zeros(n)
    def scie(f):
        return 2 * ((f * t + alea.random()) % 1) - 1

    for f in frequences:                       # deux voix par oreille, légèrement désaccordées
        g += scie(f * (1 - desaccord)) + 0.7 * scie(f)
        d += scie(f * (1 + desaccord)) + 0.7 * scie(f * (1 - desaccord * 0.5))
    env = np.minimum(1, t / attaque)
    g = filtre(g, "low", coupure, 4) * env / len(frequences)
    d = filtre(d, "low", coupure, 4) * env / len(frequences)
    return np.stack([g, d], axis=1)


def balayage(duree, f0, f1, q=2.5, forme="monte"):
    """Souffle filtré dont la fréquence glisse : filtre à variable d'état, échantillon par échantillon."""
    n = int(duree * FE)
    x = bruit(n)
    y = np.zeros(n)
    bas = bande = 0.0
    f = f0 * (f1 / f0) ** (np.arange(n) / n)
    k = 2 * np.sin(np.pi * np.minimum(f, FE / 6.5) / FE)
    for i in range(n):
        bas += k[i] * bande
        haut = x[i] - bas - bande / q
        bande += k[i] * haut
        y[i] = bande
    t = np.arange(n) / n
    env = t ** 2.2 if forme == "monte" else np.sin(np.pi * t) ** 1.6 if forme == "passe" else (1 - t) ** 2
    return y * env


# ---------- 1. nappes : ré mineur pendant le récit, ré majeur à la carte ----------
re2, la2, re3, fa3, la3, mi4 = note(-31), note(-24), note(-19), note(-16), note(-12), note(-5)
fad3, re4, fad4, la4 = note(-15), note(-7), note(-3), note(0)
recit = nappe([re2, la2, re3, fa3, la3, mi4], 10.6, 1.6, 620)
t_r = temps(len(recit))
recit *= (0.55 + 0.45 * np.clip(t_r / 9.5, 0, 1))[:, None]                 # montée lente jusqu'au train
recit *= np.clip((10.6 - t_r) / 0.6, 0, 1)[:, None]                         # s'efface sous la carte
mix[: len(recit)] += recit * 0.2
aux[: len(recit)] += recit * 0.06
final = nappe([re2, la2, re3, fad3, la3, re4, fad4], DUREE - 9.9, 0.7, 1500)
t_f = temps(len(final))
final *= (np.exp(-np.maximum(0, t_f - 1.2) / 3.4) * np.clip((DUREE - 9.9 - t_f) / 1.3, 0, 1))[:, None]
i0 = int(9.9 * FE)
mix[i0:i0 + len(final)] += final[: N - i0] * 0.26
aux[i0:i0 + len(final)] += final[: N - i0] * 0.1

# ---------- 2. construction : un coup par pièce qui se pose ----------
pieces = [(0.3, 0.0, 1.0), (0.5, -6, 0.62), (0.6, 6, 0.62), (0.75, -10.6, 0.5), (0.85, 10.6, 0.5), (1.0, -6, 0.34), (1.08, 6, 0.34),
          (1.15, -10.6, 0.3), (1.2, 10.6, 0.3), (1.3, 0, 0.42), (1.45, 0, 0.36), (1.6, 0, 0.44), (1.75, 0, 0.22),
          (1.9, -1.8, 0.2), (1.96, -0.6, 0.2), (2.02, 0.6, 0.2), (2.08, 1.8, 0.2), (2.2, 0, 0.34), (2.35, 0, 0.42)]
for t0, x, poids in pieces:
    pose_a = T["bati"] + (t0 - 0.3) * T["cadence"] + 0.42
    premier = poids == 1.0
    son = impact(grave=44 if premier else 70 + (1 - poids) * 90, aigu=150 if premier else 230 + (1 - poids) * 260,
                 duree=1.1 if premier else 0.3 + poids * 0.25, bruit_niveau=0.7 if premier else 0.35)
    poser(son, pose_a, gain=0.6 if premier else 0.2 + poids * 0.3, pan=x / 16, reverb=0.3)
# souffle d'arrivée de la caméra, avant le premier impact
poser(balayage(0.5, 300, 2600), 0.0, gain=0.09, reverb=0.3)

# ---------- 3. six lignes d'opération : six notes qui montent, puis les fenêtres ----------
gamme = [note(-7), note(-4), note(-2), note(0), note(3), note(5)]              # ré fa sol la do ré
for i, f in enumerate(gamme):
    poser(cloche(f), T["lignes"] + i * T["pas"], gain=0.2, pan=-0.6 + i * 0.24, reverb=0.55)
    poser(impact(grave=90, aigu=300, duree=0.2, bruit_niveau=0.2), T["lignes"] + i * T["pas"], gain=0.1, pan=-0.6 + i * 0.24)
n_sc = int(2.3 * FE)
scintille = filtre(bruit(n_sc), "band", [3500, 9000]) * np.sin(np.pi * temps(n_sc) / 2.3) ** 2
scintille *= 0.6 + 0.4 * np.sin(2 * np.pi * 11 * temps(n_sc))
poser(scintille, 3.7, gain=0.035, reverb=0.5)

# ---------- 4. coupes : un souffle qui monte jusqu'au changement de plan ----------
for coupe in (T["coupe2"], T["coupe3"], T["coupe4"]):
    poser(balayage(0.42, 500, 5200), coupe - 0.42, gain=0.1, reverb=0.25)
    poser(impact(grave=50, aigu=120, duree=0.45, bruit_niveau=0.25), coupe, gain=0.34, reverb=0.3)

# ---------- 5. train : roulement, échappement, frein, sifflet, passage ----------
n_tr = int(4.0 * FE)
tt = temps(n_tr) + T["train_entre"]
p_arr = np.clip((tt - T["train_entre"]) / (T["train_arret"] - T["train_entre"]), 0, 1)
v_arr = 34 * 3 * (1 - p_arr) ** 2 / (T["train_arret"] - T["train_entre"]) * (tt < T["train_arret"])
p_dep = np.clip((tt - T["train_part"]) / T["train_sortie"], 0, 1)
v_dep = 60 * 2 * p_dep / T["train_sortie"] * (tt >= T["train_part"])
vitesse = v_arr + v_dep                                                      # unités de scène par seconde
x_train = np.where(tt < T["train_arret"], -34 + 34 * (1 - (1 - p_arr) ** 3), 60 * p_dep ** 2)
proche = 1 / (1 + ((x_train - 7.6) / 9) ** 2)                               # la caméra du plan 3 est vers x = 7,6
niveau_v = np.clip(vitesse / 40, 0, 1) ** 0.6
roulement = filtre(bruit(n_tr), "low", 140, 4) * niveau_v * (0.35 + 0.65 * proche) * 2.4
poser(roulement, T["train_entre"], gain=0.2, pan=0.15)
cadence = np.clip(vitesse * 0.42, 0, 15)                                     # coups d'échappement par seconde
phase = np.cumsum(cadence) / FE
coup = np.exp(-((phase % 1) / 0.16)) * (cadence > 0.4)
echappement = filtre(bruit(n_tr), "band", [350, 2600]) * coup * (0.3 + 0.7 * proche)
poser(echappement, T["train_entre"], gain=0.27, pan=0.2, reverb=0.25)
n_fr = int(0.5 * FE)
t_fr = temps(n_fr)
frein = (np.sin(2 * np.pi * np.cumsum(2500 - 500 * t_fr / 0.5) / FE) + 0.4 * np.sin(2 * np.pi * np.cumsum(3760 - 700 * t_fr / 0.5) / FE))
frein *= np.sin(np.pi * t_fr / 0.5) ** 2
poser(frein, T["train_arret"] - 0.5, gain=0.022, pan=0.1, reverb=0.5)
n_va = int(1.0 * FE)
vapeur = filtre(bruit(n_va), "high", 4200) * enveloppe(n_va, 0.03, 0.3)
poser(vapeur, T["train_arret"], gain=0.07, pan=0.15, reverb=0.4)
n_si = int(0.62 * FE)
t_si = temps(n_si)
glisse = 1 - 0.03 * np.exp(-t_si / 0.05)
vibrato = 1 + 0.006 * np.sin(2 * np.pi * 6.5 * t_si)
sifflet = sum(niv * np.sin(2 * np.pi * np.cumsum(f * glisse * vibrato) / FE) for f, niv in ((note(5), 1.0), (note(9), 0.8), (note(12), 0.55), (note(17) * 1.003, 0.2)))
sifflet += filtre(bruit(n_si), "band", [1500, 6000]) * 0.5
sifflet *= np.minimum(1, t_si / 0.04) * np.clip((0.62 - t_si) / 0.16, 0, 1)
poser(sifflet, T["train_part"], gain=0.09, pan=0.1, reverb=0.7)
poser(balayage(0.9, 2400, 260, q=1.6, forme="passe"), 9.05, gain=0.26, pan=0.45, reverb=0.3)
# la phrase 03 claque mot à mot
for k in range(5):
    poser(impact(grave=75, aigu=210, duree=0.16, bruit_niveau=0.5), T["p3"] + k * 0.075, gain=0.13, pan=-0.45)

# ---------- 6. carte finale : accord qui s'ouvre et quatre notes ----------
poser(impact(grave=36, aigu=95, duree=1.6, bruit_niveau=0.15), T["coupe4"] + 0.02, gain=0.32, reverb=0.4)
for instant, f, g in ((T["carte"] + 0.1, note(5), 0.2), (T["carte"] + 0.3, note(9), 0.19), (T["carte"] + 0.7, note(12), 0.22), (T["carte"] + 1.3, note(17), 0.15)):
    poser(cloche(f, 2.6), instant, gain=g, pan=0.25, reverb=0.7)

# ---------- 7. réverbération, limitation, niveau ----------
n_ri = int(1.9 * FE)
t_ri = temps(n_ri)
ri = np.stack([filtre(bruit(n_ri), "low", 5200) * np.exp(-t_ri / 0.42), filtre(bruit(n_ri), "low", 5200) * np.exp(-t_ri / 0.42)], axis=1)
ri[: int(0.012 * FE)] = 0                                                    # léger retard avant la queue
for c in range(2):
    queue = signal.fftconvolve(aux[:, c], ri[:, c])[:N]
    mix[:, c] += queue * 0.02
mix = filtre(mix.T, "high", 38).T                                            # coupe l'infra-grave inutile
mix *= np.clip((DUREE - temps(N)) / 0.35, 0, 1)[:, None]                     # fondu de fin
mix *= 1.5 / np.max(np.abs(mix))                                             # les crêtes entrent dans le limiteur
mix = np.tanh(mix)                                                           # limiteur doux
mix *= NIVEAU / np.max(np.abs(mix))                                          # niveau final

ici = os.path.dirname(os.path.abspath(__file__))
sortie = os.path.join(ici, "..", "assets", "bande-son.wav")
wavfile.write(sortie, FE, (mix * 32767).astype(np.int16))
print("écrit", os.path.normpath(sortie), "crête", round(float(np.max(np.abs(mix))), 3))
