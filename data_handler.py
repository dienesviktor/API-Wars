from psycopg2 import sql
import connection


@connection.connection_handler
def get_user(cursor, username):
    cursor.execute(sql.SQL("SELECT * \
                            FROM users \
                            WHERE username = {username}").format
                   (username=sql.Literal(username)))
    return cursor.fetchall()


@connection.connection_handler
def save_user(cursor, username, password_hash):
    cursor.execute(sql.SQL("INSERT INTO users (username, password) \
                            VALUES ({username}, {password_hash})").format
                   (username=sql.Literal(username),
                    password_hash=sql.Literal(password_hash)))


@connection.connection_handler
def vote_planet(cursor, planet_id, planet_name, user_id):
    cursor.execute(sql.SQL("INSERT INTO planet_votes (planet_id, planet_name, user_id, submission_time) \
                            VALUES ({planet_id}, {planet_name}, {user_id}, CURRENT_TIMESTAMP(0))").format
                   (planet_id=sql.Literal(planet_id),
                    planet_name=sql.Literal(planet_name),
                    user_id=sql.Literal(user_id)))

@connection.connection_handler
def vote_stat(cursor):
    cursor.execute(sql.SQL("SELECT planet_name, COUNT(planet_id) AS received_votes \
                            FROM planet_votes \
                            GROUP BY planet_name \
                            ORDER BY planet_name"))
    return cursor.fetchall()