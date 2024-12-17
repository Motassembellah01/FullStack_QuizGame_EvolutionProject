import io.mockk.*
import io.socket.client.Socket
import io.socket.client.IO
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows



class SocketServiceTests {

    private val mockSocket: Socket = mockk(relaxed = true)

    @BeforeEach
    fun setUp() {
        mockkStatic(IO::class)
        every { IO.socket(any<String>()) } returns mockSocket
        SocketService.disconnect()
    }

    @Test
    fun `setUserId should define the userId`() {
        SocketService.setUserId("mockUserId")
        verify { SocketService.getUserId() === "mockUserId" }
    }

    @Test
    fun `test socket connection`() {
        SocketService.connect()

        verify { mockSocket.connect() }
        verify { mockSocket.emit("UserInfo", "") } // Ensure userId is sent
    }

    @Test
    fun `test socket disconnection`() {
        SocketService.connect()
        SocketService.disconnect()

        // Verify that the socket is disconnected
        verify { mockSocket.disconnect() }
        // Ensure userId is reset
        assert(SocketService.getSocket() == null)
    }

    @Test
    fun `test isSocketAlive when socket is connected`() {
        every { mockSocket.connected() } returns true
        SocketService.connect()

        assert(SocketService.isSocketAlive()) // Should return true
    }

    @Test
    fun `test isSocketAlive when socket is not connected`() {
        every { mockSocket.connected() } returns false
        SocketService.connect()

        assert(!SocketService.isSocketAlive()) // Should return false
    }

    @Test
    fun `test sending data through socket`() {
        SocketService.send("testEvent", "testData")

        // Verify that the correct event and data are emitted
        verify { mockSocket.emit("testEvent", "testData") }
    }

    @Test
    fun `test removing listener`() {
        SocketService.removeListener("testEvent")

        // Verify that off is called for the event
        verify { mockSocket.off("testEvent") }
    }
}
