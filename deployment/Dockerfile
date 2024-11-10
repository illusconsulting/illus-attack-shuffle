# Use the Chainguard Wolfi-based Rust image as the base for building
FROM cgr.dev/chainguard/rust as builder

# Set the working directory in the container
WORKDIR /app

# Fetch the pre-compiled binary from the artifact repository
# Define the URL of the compiled Rust binary and binary name as ARGs and set them from the .env file
ARG BINARY_URL
ARG APP_BINARY_NAME
RUN curl -L $BINARY_URL -o /app/$APP_BINARY_NAME && chmod +x /app/$APP_BINARY_NAME

# Multi-stage build to keep the final image minimal
FROM cgr.dev/chainguard/static:latest

# Set the working directory
WORKDIR /app

# Copy the compiled Rust application from the builder stage
COPY --from=builder /app/${APP_BINARY_NAME} /app/${APP_BINARY_NAME}

# Set build arguments to configure runtime environment variables
ARG APP_PORT
ARG APP_LOG_LEVEL
ARG LOG_FILE_PATH
ARG APP_CMD

# Set environment variables for runtime from build arguments
ENV APP_PORT=${APP_PORT}
ENV APP_LOG_LEVEL=${APP_LOG_LEVEL}
ENV LOG_FILE_PATH=${LOG_FILE_PATH}

# Expose the application port
EXPOSE ${APP_PORT}

# Set the entrypoint to the Rust application binary name
ENTRYPOINT ["/app/${APP_BINARY_NAME}"]

# Set CMD to use additional runtime arguments if provided in .env
CMD ${APP_CMD}
