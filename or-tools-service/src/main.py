import time
import pika
import json
import os
from dotenv import load_dotenv
import vrpSolver
from publish import send_to_exchange
import boto3
from botocore.exceptions import NoCredentialsError, ClientError

# Load the environment variables from the .env file
load_dotenv()

SUBMISSIONS_EXCHANGE = os.getenv('SUBMISSIONS_EXCHANGE')
SOLVER_SUBMISSIONS_QUEUE = os.getenv('SOLVER_SUBMISSIONS_QUEUE')
RABBITMQ_DEFAULT_USER = os.getenv('RABBITMQ_DEFAULT_USER')
RABBITMQ_DEFAULT_PASS = os.getenv('RABBITMQ_DEFAULT_PASS')
RABBITMQ_HOST=os.getenv("RABBITMQ_HOST", "messaging-service")
RABBITMQ_PORT=int(os.getenv("RABBITMQ_PORT", 5672))


def read_file_from_bucket(bucket_name, file_names, access_key, secret_key, endpoint_url=None):
    """
    Read a file's data directly from a MinIO or S3-compatible bucket.

    :param bucket_name: The name of the bucket.
    :param file_name: The name of the file to read from the bucket.
    :param access_key: MinIO/S3 access key.
    :param secret_key: MinIO/S3 secret key.
    :param endpoint_url: The URL of the MinIO server.
    :return: The content of the file as a string.
    """
    try:
        # Create a session and client for MinIO/S3
        s3_client = boto3.client(
            's3',
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            endpoint_url=endpoint_url  # For MinIO, specify the endpoint
        )
        response=[]
        # Get the object from the bucket
        for file_name in file_names:
            response.append(s3_client.get_object(Bucket=bucket_name, Key=file_name)['Body'].read().decode('utf-8') )
        return response

    except NoCredentialsError:
        print("Credentials not available.")
    except ClientError as e:
        print(f"Error occurred: {e}")
        return None

def callback(ch, method, properties, body):
    print("[x] Received message")

    message=json.loads(body)
    destination_host=message["DestinationInformation"]["Host"]
    destination_port=message["DestinationInformation"]["Port"]
    destination_type=message["DestinationInformation"]["Type"]
    destination_exchange=message["DestinationInformation"]["Exchange"]
    destination_credentials_name=message["DestinationInformation"]["Credentials"]["Name"]
    destination_credentials_pass=message["DestinationInformation"]["Credentials"]["Pass"]
    destination_extra=message["DestinationInformation"]["Extra"]
    databaseFiles_URL=message["DatabaseFiles"]["URL"]
    databaseFiles_bucketName=message["DatabaseFiles"]["BucketName"]
    databaseFiles_InputDataFile=message["DatabaseFiles"]["InputDataFile"]
    databaseFiles_MetadataFile=message["DatabaseFiles"]["MetadataFile"]
    databaseFiles_credentials_accessKey=message["DatabaseFiles"]["Credentials"]["AccessKey"]
    databaseFiles_credentials_secretKey=message["DatabaseFiles"]["Credentials"]["SecretKey"]

    def get_files(
            databaseFiles_URL,
            databaseFiles_bucketName,
            databaseFiles_InputDataFile,
            databaseFiles_credentials_accessKey,
            databaseFiles_credentials_secretKey,
            databaseFiles_MetadataFile
            ):
        '''
        Get location files for solver
        ''' 

        response=read_file_from_bucket(
            bucket_name=databaseFiles_bucketName,
            file_names=[databaseFiles_InputDataFile, databaseFiles_MetadataFile],
            access_key=databaseFiles_credentials_accessKey,
            secret_key=databaseFiles_credentials_secretKey,
            endpoint_url=databaseFiles_URL,
        )

        metadata_json = json.loads(response.pop())
        locations = []
        for location_list_json in response:
            location_list = json.loads(location_list_json)
            locations.extend(location_list["Locations"])

        return {"locations":locations,"num_vehicles":metadata_json["num_vehicles"],"depot":metadata_json["depot"],"max_distance":metadata_json["max_distance"]} 

    _data=get_files(
        databaseFiles_URL,
        databaseFiles_bucketName=databaseFiles_bucketName,
        databaseFiles_InputDataFile=databaseFiles_InputDataFile,
        databaseFiles_credentials_accessKey=databaseFiles_credentials_accessKey,
        databaseFiles_credentials_secretKey=databaseFiles_credentials_secretKey,
        databaseFiles_MetadataFile=databaseFiles_MetadataFile
    )
    
    # Measure execution time
    execution_started = time.time()
    solution = vrpSolver.main(_data)
    execution_ended = time.time()

    # Calculate execution time
    execution_time = execution_ended - execution_started

    print(f"Message content: {message}")
    print(f"Solution: {solution}")
    
    send_to_exchange(
        message={
            "solution": solution,
            "extra": destination_extra,
            "executionTime": execution_time
        },
        destination_host=destination_host,
        destination_port=destination_port,
        destination_exchange=destination_exchange,
        destination_credentials_name=destination_credentials_name,
        destination_credentials_pass=destination_credentials_pass,
    )

    # Acknowledge the message
    ch.basic_ack(delivery_tag=method.delivery_tag)

def consume_rabbitmq():
    # RabbitMQ connection parameters
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(
            host=RABBITMQ_HOST,
            port=RABBITMQ_PORT,
            credentials=pika.PlainCredentials(
                RABBITMQ_DEFAULT_USER,
                RABBITMQ_DEFAULT_PASS
            )
        )
    )

    # Create a channel
    channel = connection.channel()

    # Declare the exchange
    channel.exchange_declare(exchange=SUBMISSIONS_EXCHANGE, exchange_type='fanout', durable=True)

    # Ensure the queue is declared (it won't create a new queue if it already exists)
    channel.queue_declare(queue=SOLVER_SUBMISSIONS_QUEUE, durable=True)

    # Bind the queue to the exchange
    channel.queue_bind(exchange=SUBMISSIONS_EXCHANGE, queue=SOLVER_SUBMISSIONS_QUEUE)

    # Set up subscription on the queue
    channel.basic_consume(
        queue=SOLVER_SUBMISSIONS_QUEUE,
        on_message_callback=callback,
        auto_ack=False  # We will manually acknowledge after processing
    )

    print(f"[*] Waiting for messages in {SOLVER_SUBMISSIONS_QUEUE}. To exit press CTRL+C")
    
    # Start consuming (this will block and wait for messages)
    channel.start_consuming()

consume_rabbitmq()