import pika
import json


def send_to_exchange(
        message,
        destination_host,
        destination_port,
        destination_exchange,
        destination_credentials_name,
        destination_credentials_pass
        ):
    
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(
            host=destination_host,  
            port=destination_port,
            credentials=pika.PlainCredentials(
                destination_credentials_name
                , destination_credentials_pass)
        )
    )

    # Create a channel
    channel = connection.channel()

    # Publish the message to the queue
    channel.basic_publish(
        exchange=destination_exchange,  # No exchange means we're sending directly to the queue
        routing_key="",
        body=json.dumps(message),  # Convert the message to JSON string format
        properties=pika.BasicProperties(
            delivery_mode=2  # Make the message persistent
        )
    )

    print(f"[x] Sent message to exchange {destination_exchange} : {message}")

    # Close the connection
    connection.close()