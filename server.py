from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
import data_handler
import util

app = Flask(__name__)

app.secret_key = b'secretKey123.'


@app.route("/")
def index():
    if "username" not in session:
        session["username"] = None
    return render_template("index.html", user=session["username"])


@app.route('/registration', methods=["GET", "POST"])
def registration():
    if request.method == "POST":
        username = request.form["email"]
        password = request.form["password"]
        user = data_handler.get_user(username)
        if not username or not password:
            flash("Error: Please, fill in both fields!")
            return redirect(url_for("registration"))
        if user:
            flash("Error: Username already exists, please choose another one!")
            return redirect(url_for("registration"))
        password_hash = util.hash_password(password)
        data_handler.save_user(username, password_hash)
        flash("Successful registration. Log in to continue!")
        return redirect(url_for("login"))
    return render_template("registration.html", user=session["username"])


@app.route('/login', methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form["email"]
        password = request.form["password"]
        user = data_handler.get_user(username)
        if user:
            if util.verify_password(password, user[0]["password"]):
                session["username"] = username
                session["user-id"] = user[0]["id"]
                return redirect(url_for("index"))
            else:
                flash("Error: Wrong username or password!")
        else:
            flash("Error: Wrong username or password!")
    return render_template("login.html", user=session["username"])


@app.route('/logout')
def logout():
    session["username"] = None
    session["user-id"] = None
    return redirect(url_for("index"))


@app.route('/get-user')
def get_user():
    return jsonify(session["username"])


@app.route('/vote', methods=["POST"])
def vote():
    data = request.get_json()
    planet_id = data["planet-id"]
    planet_name = data["planet-name"]
    user_id = session["user-id"]
    data_handler.vote_planet(planet_id, planet_name, user_id)
    return jsonify(planet=planet_name)


@app.route('/vote-stat')
def vote_stat():
    vote_stat = data_handler.vote_stat()
    return jsonify(vote_stat)